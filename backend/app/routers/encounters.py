import asyncio
import logging
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from app.schemas.encounter import StartEncounterRequest, EncounterResponse
from app.services import encounter_service
from app.services.deepgram_client import transcribe_prerecorded
from app.dependencies import get_current_user
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.clinical_summary import ClinicalSummary
from app.models.prescription import Prescription
from app.models.transcript_segment import TranscriptSegment
from app.models.encounter import Encounter
from beanie.odm.fields import PydanticObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/encounters", tags=["encounters"])


def _enc_dict(e):
    return {
        "id": str(e.id),
        "doctor_id": str(e.doctor_id),
        "patient_id": str(e.patient_id),
        "status": e.status,
        "start_time": e.start_time.isoformat() if e.start_time else None,
        "end_time": e.end_time.isoformat() if e.end_time else None,
        "transcript_text": e.transcript_text,
        "created_at": e.created_at.isoformat(),
    }


@router.get("", response_model=list)
async def list_encounters(current_user: Doctor = Depends(get_current_user)):
    """List all encounters for the current doctor, with patient name."""
    encounters = await encounter_service.list_encounters(current_user.id)
    result = []
    for enc in encounters:
        patient = await Patient.get(enc.patient_id)
        duration_secs = None
        if enc.start_time and enc.end_time:
            duration_secs = int((enc.end_time - enc.start_time).total_seconds())
        result.append({
            "id": str(enc.id),
            "patient_id": str(enc.patient_id),
            "patient_name": patient.name if patient else "Unknown",
            "patient_age": patient.age if patient else None,
            "patient_gender": patient.gender if patient else None,
            "status": enc.status,
            "start_time": enc.start_time.isoformat() if enc.start_time else None,
            "end_time": enc.end_time.isoformat() if enc.end_time else None,
            "duration_secs": duration_secs,
            "created_at": enc.created_at.isoformat(),
        })
    return result


@router.get("/{encounter_id}/detail", response_model=dict)
async def get_encounter_detail(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Return full encounter detail: transcript segments + clinical summary + prescriptions."""
    encounter = await encounter_service.get_encounter(encounter_id, current_user.id)
    patient = await Patient.get(encounter.patient_id)

    # Load saved analysis from MongoDB
    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    prescription = await Prescription.find_one(
        Prescription.encounter_id == PydanticObjectId(encounter_id)
    )
    segments = await TranscriptSegment.find(
        TranscriptSegment.encounter_id == PydanticObjectId(encounter_id)
    ).sort("+start_time").to_list()

    summary_data = None
    if summary:
        summary_data = {
            "id": str(summary.id),
            "chief_complaint": summary.chief_complaint,
            "history_of_present_illness": summary.history_of_present_illness,
            "physical_examination": summary.physical_examination,
            "assessment": summary.assessment,
            "plan": summary.plan,
            "summary_text": summary.summary_text,
            "diagnosis": summary.diagnosis,
            "vitals": summary.vitals.model_dump() if summary.vitals else None,
        }

    medications = []
    if prescription:
        medications = [
            {
                "name": m.name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "duration": m.duration,
                "instructions": m.instructions,
                "is_suggested": m.is_suggested,
            }
            for m in prescription.medications
        ]

    return {
        "encounter": {
            **_enc_dict(encounter),
            "patient_name": patient.name if patient else "Unknown",
            "patient_age": patient.age if patient else None,
            "patient_gender": patient.gender if patient else None,
        },
        "summary": summary_data,
        "prescriptions": medications,
        "segments": [
            {
                "id": str(s.id),
                "speaker": s.speaker,
                "text": s.text,
                "start_time": s.start_time,
                "end_time": s.end_time,
            }
            for s in segments
        ],
    }


@router.post("/start", response_model=dict, status_code=201)
async def start_encounter(
    body: StartEncounterRequest,
    current_user: Doctor = Depends(get_current_user),
):
    encounter = await encounter_service.start_encounter(current_user.id, body.patient_id)
    return _enc_dict(encounter)


@router.patch("/{encounter_id}/pause", response_model=dict)
async def pause_encounter(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    encounter = await encounter_service.transition_encounter(encounter_id, current_user.id, "PAUSED")
    return _enc_dict(encounter)


@router.patch("/{encounter_id}/resume", response_model=dict)
async def resume_encounter(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    encounter = await encounter_service.transition_encounter(encounter_id, current_user.id, "ACTIVE")
    return _enc_dict(encounter)


@router.post("/{encounter_id}/finish", response_model=dict)
async def finish_encounter(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    encounter = await encounter_service.transition_encounter(encounter_id, current_user.id, "FINISHED")
    return _enc_dict(encounter)


@router.get("/{encounter_id}", response_model=dict)
async def get_encounter(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    encounter = await encounter_service.get_encounter(encounter_id, current_user.id)
    return _enc_dict(encounter)


@router.post("/{encounter_id}/upload-audio", status_code=202)
async def upload_session_audio(
    encounter_id: str,
    file: UploadFile = File(...),
    current_user: Doctor = Depends(get_current_user),
):
    """
    Layer 2 resilience: accept a full-session WebM audio blob recorded locally.
    Transcribes via Deepgram prerecorded API and fills any gaps in the transcript.
    Returns 202 immediately; transcription runs as a background task.
    """
    await encounter_service.get_encounter(encounter_id, current_user.id)  # ownership check

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    asyncio.create_task(_process_uploaded_audio(encounter_id, audio_bytes))
    return {"status": "processing", "encounter_id": encounter_id}


async def _process_uploaded_audio(encounter_id: str, audio_bytes: bytes):
    """Background task: transcribe prerecorded audio and merge non-overlapping segments."""
    try:
        segments_data = await transcribe_prerecorded(audio_bytes)
    except Exception as e:
        logger.error(f"Prerecorded transcription failed for {encounter_id}: {e}")
        return

    # Load existing segments to check for overlaps
    existing = await TranscriptSegment.find(
        TranscriptSegment.encounter_id == PydanticObjectId(encounter_id)
    ).sort("+start_time").to_list()

    def overlaps_any(start: float, end: float) -> bool:
        for seg in existing:
            if start < seg.end_time and end > seg.start_time:
                return True
        return False

    new_count = 0
    for item in segments_data:
        start, end, text, speaker = item["start"], item["end"], item["transcript"].strip(), item["speaker"]
        if not text or overlaps_any(start, end):
            continue
        seg = TranscriptSegment(
            encounter_id=PydanticObjectId(encounter_id),
            speaker=f"SPEAKER_{speaker}",
            text=text,
            start_time=start,
            end_time=end,
        )
        await seg.insert()
        new_count += 1

    if new_count == 0:
        logger.info(f"No new segments from uploaded audio for {encounter_id}")
        return

    # Rebuild transcript_text from all segments sorted by start_time
    all_segments = await TranscriptSegment.find(
        TranscriptSegment.encounter_id == PydanticObjectId(encounter_id)
    ).sort("+start_time").to_list()

    transcript_text = "\n".join(f"{s.speaker}: {s.text}" for s in all_segments)
    encounter = await Encounter.get(PydanticObjectId(encounter_id))
    if encounter:
        encounter.transcript_text = transcript_text
        await encounter.save()

    logger.info(f"Uploaded audio added {new_count} gap segments for {encounter_id}")
