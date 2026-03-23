import logging
from typing import AsyncIterator
from beanie.odm.fields import PydanticObjectId
from app.models.encounter import Encounter
from app.models.patient import Patient
from app.models.clinical_summary import ClinicalSummary
from app.models.prescription import Prescription
from app.services.llm_service import chat_completion_stream
from app.services.prompts import chat_messages
from app.core.exceptions import NotFoundError

logger = logging.getLogger(__name__)


async def stream_chat_response(
    encounter_id: str,
    doctor_id: PydanticObjectId,
    question: str,
) -> AsyncIterator[str]:
    encounter = await Encounter.get(PydanticObjectId(encounter_id))
    if not encounter or encounter.doctor_id != doctor_id:
        raise NotFoundError("Encounter not found")

    patient = await Patient.get(encounter.patient_id)
    patient_info = f"Name: {patient.name}, Age: {patient.age}, Gender: {patient.gender}" if patient else "Unknown"

    # Current encounter summary
    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    summary_text = summary.summary_text if summary else ""

    # Current prescriptions
    rx = await Prescription.find_one(
        Prescription.encounter_id == PydanticObjectId(encounter_id)
    )
    rx_text = ""
    if rx:
        rx_text = ", ".join(
            f"{m.name} {m.dosage} {m.frequency}" for m in rx.medications
        )

    # Last 3 past encounter summaries for this patient
    past_encounters = await Encounter.find(
        Encounter.patient_id == encounter.patient_id,
        Encounter.id != PydanticObjectId(encounter_id),
        Encounter.status == "FINISHED",
    ).sort(-Encounter.created_at).limit(3).to_list()

    past_summaries = ""
    for pe in past_encounters:
        ps = await ClinicalSummary.find_one(ClinicalSummary.encounter_id == pe.id)
        if ps:
            past_summaries += f"\n[{pe.created_at.strftime('%Y-%m-%d')}] {ps.summary_text}"

    messages = chat_messages(
        patient_info=patient_info,
        transcript=encounter.transcript_text,
        summary=summary_text,
        prescriptions=rx_text,
        past_summaries=past_summaries,
        question=question,
    )

    async for token in chat_completion_stream(messages):
        yield token
