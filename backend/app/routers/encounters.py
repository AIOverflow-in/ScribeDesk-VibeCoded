import asyncio
import logging
import secrets
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.schemas.encounter import StartEncounterRequest
from app.services import encounter_service
from app.services.deepgram_client import transcribe_prerecorded
from app.services.llm_service import chat_completion, parse_json_response
from app.services.prompts import (
    prescription_messages, clinical_summary_messages, vitals_extraction_messages,
    billing_extraction_messages, patient_summary_messages, drug_interaction_messages,
    evidence_messages, pre_visit_messages,
)
from app.dependencies import get_current_user
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.clinical_summary import ClinicalSummary, Vitals, BillingCode, DrugInteraction
from app.models.prescription import Prescription, Medication
from app.models.transcript_segment import TranscriptSegment
from app.models.template import Template
from app.models.encounter import Encounter
from beanie.odm.fields import PydanticObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/encounters", tags=["encounters"])


def _clean_med(m: dict) -> dict:
    """Sanitize LLM-returned medication dict: convert 'null'/'None' string literals to empty string."""
    for field in ("dosage", "frequency", "duration"):
        if isinstance(m.get(field), str) and m[field].lower() in ("null", "none"):
            m[field] = ""
    return m


def _enc_dict(e):
    return {
        "id": str(e.id),
        "doctor_id": str(e.doctor_id),
        "patient_id": str(e.patient_id),
        "status": e.status,
        "start_time": e.start_time.isoformat() if e.start_time else None,
        "end_time": e.end_time.isoformat() if e.end_time else None,
        "transcript_text": e.transcript_text,
        "template_id": str(e.template_id) if e.template_id else None,
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
            "billing_codes": [c.model_dump() for c in summary.billing_codes],
            "patient_summary": summary.patient_summary,
            "drug_interactions": [i.model_dump() for i in summary.drug_interactions],
            "attested": summary.attested,
            "attested_at": summary.attested_at.isoformat() if summary.attested_at else None,
            "evidence": summary.evidence,
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
    encounter = await encounter_service.start_encounter(current_user.id, body.patient_id, body.template_id, body.language or "en")
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


@router.post("/{encounter_id}/generate-prescription", response_model=list)
async def generate_prescription(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Generate medication suggestions from the encounter transcript and clinical summary."""
    encounter = await encounter_service.get_encounter(encounter_id, current_user.id)
    if not encounter.transcript_text or not encounter.transcript_text.strip():
        raise HTTPException(status_code=400, detail="No transcript available")

    # Get existing summary text for better prescription context
    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    summary_text = summary.summary_text if summary else ""

    text = await chat_completion(
        prescription_messages(encounter.transcript_text, summary_text),
        json_mode=True,
    )
    result = await parse_json_response(text)
    meds = [Medication(**_clean_med(m)) for m in result.get("medications", []) if m.get("name")]

    if not meds:
        return []

    # Replace any existing prescription for this encounter
    existing = await Prescription.find_one(
        Prescription.encounter_id == PydanticObjectId(encounter_id)
    )
    if existing:
        await existing.delete()

    rx = Prescription(encounter_id=PydanticObjectId(encounter_id), medications=meds)
    await rx.insert()

    return [
        {
            "name": m.name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "duration": m.duration,
            "instructions": m.instructions,
            "is_suggested": m.is_suggested,
        }
        for m in meds
    ]


class RegenerateSummaryRequest(BaseModel):
    template_id: Optional[str] = None


@router.post("/{encounter_id}/regenerate-summary", response_model=dict)
async def regenerate_summary(
    encounter_id: str,
    body: RegenerateSummaryRequest,
    current_user: Doctor = Depends(get_current_user),
):
    """Re-run clinical summary generation, optionally with a different template."""
    encounter = await encounter_service.get_encounter(encounter_id, current_user.id)
    if not encounter.transcript_text or not encounter.transcript_text.strip():
        raise HTTPException(status_code=400, detail="No transcript available")

    # Determine template content
    template_content = None
    template_id_to_use = body.template_id or (str(encounter.template_id) if encounter.template_id else None)
    if template_id_to_use:
        tmpl = await Template.get(PydanticObjectId(template_id_to_use))
        if tmpl:
            template_content = tmpl.content

    specialization = current_user.specialization or "General Physician"

    # Run summary + vitals concurrently
    import asyncio as _asyncio
    results = await _asyncio.gather(
        _run_summary_inline(encounter.transcript_text, specialization, template_content),
        _run_vitals_inline(encounter.transcript_text),
        return_exceptions=True,
    )
    summary_data, vitals_data = results

    if isinstance(summary_data, Exception) or not summary_data:
        raise HTTPException(status_code=500, detail="Summary generation failed")

    # Replace existing clinical summary
    existing = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    if existing:
        await existing.delete()

    summary = ClinicalSummary(
        encounter_id=PydanticObjectId(encounter_id),
        chief_complaint=summary_data.get("chief_complaint"),
        history_of_present_illness=summary_data.get("history_of_present_illness"),
        physical_examination=summary_data.get("physical_examination"),
        assessment=summary_data.get("assessment"),
        plan=summary_data.get("plan"),
        summary_text=summary_data.get("summary_text", ""),
        diagnosis=summary_data.get("diagnosis", []),
    )
    if vitals_data and not isinstance(vitals_data, Exception):
        summary.vitals = Vitals(**{k: v for k, v in vitals_data.items() if v is not None})

    # Update template_id on encounter if changed
    if body.template_id and body.template_id != str(encounter.template_id or ""):
        encounter.template_id = PydanticObjectId(body.template_id)
        await encounter.save()

    await summary.insert()

    return {
        "chief_complaint": summary.chief_complaint,
        "history_of_present_illness": summary.history_of_present_illness,
        "physical_examination": summary.physical_examination,
        "assessment": summary.assessment,
        "plan": summary.plan,
        "summary_text": summary.summary_text,
        "diagnosis": summary.diagnosis,
        "vitals": summary.vitals.model_dump() if summary.vitals else None,
    }


async def _run_summary_inline(transcript: str, specialization: str, template_content: str | None) -> dict:
    text = await chat_completion(
        clinical_summary_messages(transcript, specialization, template_content),
        json_mode=True,
    )
    return await parse_json_response(text)


async def _run_vitals_inline(transcript: str) -> dict:
    text = await chat_completion(vitals_extraction_messages(transcript), json_mode=True)
    return await parse_json_response(text)


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


# ─── Billing Codes ────────────────────────────────────────────────────────────

@router.post("/{encounter_id}/generate-billing-codes", response_model=list)
async def generate_billing_codes(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Generate ICD-10 and CPT billing code suggestions from the encounter."""
    encounter = await encounter_service.get_encounter(encounter_id, current_user.id)
    if not encounter.transcript_text or not encounter.transcript_text.strip():
        raise HTTPException(status_code=400, detail="No transcript available")

    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    summary_str = summary.summary_text if summary else ""

    text = await chat_completion(
        billing_extraction_messages(encounter.transcript_text, summary_str),
        json_mode=True,
    )
    result = await parse_json_response(text)
    codes = [
        BillingCode(**c) for c in result.get("billing_codes", [])
        if c.get("code") and c.get("description")
    ]

    if summary:
        summary.billing_codes = codes
        await summary.save()

    return [c.model_dump() for c in codes]


@router.patch("/{encounter_id}/billing-codes/{code}/accept", response_model=dict)
async def toggle_billing_code(
    encounter_id: str,
    code: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Toggle accepted state of a billing code."""
    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    if not summary:
        raise HTTPException(status_code=404, detail="No summary found")
    for bc in summary.billing_codes:
        if bc.code == code:
            bc.accepted = not bc.accepted
            break
    await summary.save()
    return {"ok": True}


# ─── Patient-Facing Summary ───────────────────────────────────────────────────

@router.post("/{encounter_id}/generate-patient-summary", response_model=dict)
async def generate_patient_summary(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Generate a plain-English after-visit summary for the patient."""
    encounter = await encounter_service.get_encounter(encounter_id, current_user.id)
    if not encounter.transcript_text or not encounter.transcript_text.strip():
        raise HTTPException(status_code=400, detail="No transcript available")

    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    prescription = await Prescription.find_one(
        Prescription.encounter_id == PydanticObjectId(encounter_id)
    )

    summary_str = ""
    if summary:
        parts = [
            f"Chief Complaint: {summary.chief_complaint or ''}",
            f"Assessment: {summary.assessment or ''}",
            f"Plan: {summary.plan or ''}",
            f"Diagnoses: {', '.join(summary.diagnosis)}",
        ]
        summary_str = "\n".join(parts)

    medications_str = ""
    if prescription:
        medications_str = "\n".join(
            f"{m.name} {m.dosage} {m.frequency} for {m.duration}" for m in prescription.medications
        )

    text = await chat_completion(
        patient_summary_messages(encounter.transcript_text, summary_str, medications_str),
        json_mode=True,
    )
    result = await parse_json_response(text)
    patient_summary_text = result.get("patient_summary", "")

    if summary:
        summary.patient_summary = patient_summary_text
        await summary.save()

    return {"patient_summary": patient_summary_text}


# ─── Drug Interaction Check ───────────────────────────────────────────────────

@router.post("/{encounter_id}/check-drug-interactions", response_model=list)
async def check_drug_interactions(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Check for drug interactions across all prescribed medications."""
    await encounter_service.get_encounter(encounter_id, current_user.id)

    prescription = await Prescription.find_one(
        Prescription.encounter_id == PydanticObjectId(encounter_id)
    )
    if not prescription or len(prescription.medications) < 2:
        return []

    med_names = [m.name for m in prescription.medications]
    text = await chat_completion(drug_interaction_messages(med_names), json_mode=True)
    result = await parse_json_response(text)
    interactions = [
        DrugInteraction(**i) for i in result.get("interactions", [])
        if i.get("drug_a") and i.get("drug_b")
    ]

    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    if summary:
        summary.drug_interactions = interactions
        await summary.save()

    return [i.model_dump() for i in interactions]


# ─── Evidence-Based Suggestions ───────────────────────────────────────────────

@router.post("/{encounter_id}/generate-evidence", response_model=list)
async def generate_evidence(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Generate evidence-based clinical recommendations for the diagnoses."""
    await encounter_service.get_encounter(encounter_id, current_user.id)

    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    if not summary or not summary.diagnosis:
        return []

    specialization = current_user.specialization or "General Physician"
    text = await chat_completion(
        evidence_messages(summary.diagnosis, specialization),
        json_mode=True,
    )
    result = await parse_json_response(text)
    ev = result.get("evidence", [])

    summary.evidence = ev
    await summary.save()
    return ev


# ─── Attestation ──────────────────────────────────────────────────────────────

@router.post("/{encounter_id}/attest", response_model=dict)
async def attest_encounter(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Doctor attests / signs off on the AI-generated clinical note."""
    await encounter_service.get_encounter(encounter_id, current_user.id)

    from datetime import datetime
    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    if not summary:
        raise HTTPException(status_code=404, detail="No clinical summary to attest")

    summary.attested = True
    summary.attested_at = datetime.utcnow()
    await summary.save()
    return {"attested": True, "attested_at": summary.attested_at.isoformat()}


# ─── Sharing ──────────────────────────────────────────────────────────────────

@router.post("/{encounter_id}/share", response_model=dict)
async def share_encounter(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Generate a read-only share token for this encounter."""
    encounter = await encounter_service.get_encounter(encounter_id, current_user.id)
    if not encounter.share_token:
        encounter.share_token = secrets.token_urlsafe(24)
        await encounter.save()
    return {"share_token": encounter.share_token}


@router.get("/shared/{token}", response_model=dict)
async def get_shared_encounter(token: str):
    """Public read-only view of a shared encounter (no auth required)."""
    encounter = await Encounter.find_one(Encounter.share_token == token)
    if not encounter:
        raise HTTPException(status_code=404, detail="Shared encounter not found or link expired")

    patient = await Patient.get(encounter.patient_id)
    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == encounter.id
    )
    prescription = await Prescription.find_one(
        Prescription.encounter_id == encounter.id
    )

    summary_data = None
    if summary:
        summary_data = {
            "chief_complaint": summary.chief_complaint,
            "assessment": summary.assessment,
            "plan": summary.plan,
            "diagnosis": summary.diagnosis,
        }

    return {
        "patient_name": patient.name if patient else "Patient",
        "start_time": encounter.start_time.isoformat() if encounter.start_time else None,
        "summary": summary_data,
        "medications": [
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency, "duration": m.duration}
            for m in prescription.medications
        ] if prescription else [],
    }


# ─── EHR Copy Helper ──────────────────────────────────────────────────────────

@router.get("/{encounter_id}/ehr-summary", response_model=dict)
async def get_ehr_summary(
    encounter_id: str,
    format: str = "plain",
    current_user: Doctor = Depends(get_current_user),
):
    """Return the clinical note formatted for pasting into an EHR."""
    await encounter_service.get_encounter(encounter_id, current_user.id)

    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    prescription = await Prescription.find_one(
        Prescription.encounter_id == PydanticObjectId(encounter_id)
    )

    if not summary:
        raise HTTPException(status_code=404, detail="No clinical summary available")

    vitals_str = ""
    if summary.vitals:
        v = summary.vitals
        parts = []
        if v.blood_pressure: parts.append(f"BP: {v.blood_pressure}")
        if v.heart_rate: parts.append(f"HR: {v.heart_rate}")
        if v.temperature: parts.append(f"Temp: {v.temperature}")
        if v.spo2: parts.append(f"SpO2: {v.spo2}")
        if v.weight: parts.append(f"Wt: {v.weight}")
        vitals_str = " | ".join(parts)

    meds_str = ""
    if prescription:
        meds_str = "\n".join(
            f"  - {m.name} {m.dosage} {m.frequency} x {m.duration}"
            for m in prescription.medications
        )

    plain = f"""CHIEF COMPLAINT:
{summary.chief_complaint or 'N/A'}

HISTORY OF PRESENT ILLNESS:
{summary.history_of_present_illness or 'N/A'}

PHYSICAL EXAMINATION:
{summary.physical_examination or 'N/A'}

VITALS:
{vitals_str or 'Not recorded'}

ASSESSMENT:
{summary.assessment or 'N/A'}

PLAN:
{summary.plan or 'N/A'}

DIAGNOSES:
{', '.join(summary.diagnosis) if summary.diagnosis else 'None'}

MEDICATIONS:
{meds_str or 'None prescribed'}

[Generated by ScribeDesk AI — requires physician review and attestation]"""

    return {"format": format, "content": plain}


# ─── Pre-Visit Brief ──────────────────────────────────────────────────────────

@router.get("/pre-visit/{patient_id}", response_model=dict)
async def get_pre_visit_brief(
    patient_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Generate a pre-visit brief from the patient's past encounters."""
    patient = await Patient.get(PydanticObjectId(patient_id))
    if not patient or patient.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Patient not found")

    past_encounters = await Encounter.find(
        Encounter.patient_id == PydanticObjectId(patient_id),
        Encounter.status == "FINISHED",
    ).sort(-Encounter.created_at).limit(5).to_list()

    if not past_encounters:
        return {"has_history": False, "last_visit_summary": None, "active_diagnoses": [], "current_medications": [], "pending_follow_ups": [], "notable_flags": []}

    enc_data = []
    for enc in past_encounters:
        summary = await ClinicalSummary.find_one(
            ClinicalSummary.encounter_id == enc.id
        )
        prescription = await Prescription.find_one(
            Prescription.encounter_id == enc.id
        )
        meds_str = ""
        if prescription:
            meds_str = ", ".join(m.name for m in prescription.medications)
        enc_data.append({
            "date": enc.start_time.strftime("%B %d, %Y") if enc.start_time else "Unknown",
            "chief_complaint": summary.chief_complaint if summary else None,
            "assessment": summary.assessment if summary else None,
            "plan": summary.plan if summary else None,
            "diagnosis": summary.diagnosis if summary else [],
            "medications": meds_str,
        })

    text = await chat_completion(
        pre_visit_messages(patient.name, enc_data),
        json_mode=True,
    )
    result = await parse_json_response(text)
    result["has_history"] = True
    return result
