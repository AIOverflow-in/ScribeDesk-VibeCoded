from beanie.odm.fields import PydanticObjectId
from app.models.encounter import Encounter
from app.models.clinical_summary import ClinicalSummary
from app.models.prescription import Prescription
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.letter import Letter
from app.services.llm_service import chat_completion, parse_json_response
from app.services.prompts import letter_generation_messages
from app.core.exceptions import NotFoundError
from datetime import date


async def generate_letter(
    encounter_id: str,
    doctor_id: PydanticObjectId,
    letter_type: str,
) -> Letter:
    encounter = await Encounter.get(PydanticObjectId(encounter_id))
    if not encounter or encounter.doctor_id != doctor_id:
        raise NotFoundError("Encounter not found")

    patient = await Patient.get(encounter.patient_id)
    doctor = await Doctor.get(doctor_id)
    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    prescription = await Prescription.find_one(
        Prescription.encounter_id == PydanticObjectId(encounter_id)
    )

    patient_name = patient.name if patient else "Patient"
    patient_age = str(patient.age) + "y" if patient and patient.age else "Age unknown"
    doctor_name = doctor.name if doctor else "Doctor"
    specialization = (doctor.specialization or "General Physician") if doctor else "General Physician"
    letterhead = (doctor.letterhead_text or f"Dr. {doctor_name}\n{specialization}") if doctor else f"Dr. {doctor_name}"

    medications_str = ""
    if prescription and prescription.medications:
        med_lines = [f"{m.name} {m.dosage} - {m.frequency} for {m.duration}" for m in prescription.medications]
        medications_str = "\n".join(med_lines)
    else:
        medications_str = "None recorded"

    summary_str = ""
    if summary:
        parts = []
        if summary.chief_complaint:
            parts.append(f"Chief Complaint: {summary.chief_complaint}")
        if summary.assessment:
            parts.append(f"Assessment: {summary.assessment}")
        if summary.plan:
            parts.append(f"Plan: {summary.plan}")
        if summary.diagnosis:
            parts.append(f"Diagnoses: {', '.join(summary.diagnosis)}")
        summary_str = "\n".join(parts)

    transcript_excerpt = encounter.transcript_text[:2000] if encounter.transcript_text else ""

    messages = letter_generation_messages(
        letter_type=letter_type,
        transcript=transcript_excerpt,
        summary=summary_str,
        medications=medications_str,
        patient_name=patient_name,
        patient_age=patient_age,
        doctor_name=doctor_name,
        specialization=specialization,
        letterhead=letterhead,
    )

    text = await chat_completion(messages, json_mode=True)
    result = await parse_json_response(text)
    letter_html = result.get("letter_html", "<p>Letter could not be generated.</p>")

    letter = Letter(
        encounter_id=PydanticObjectId(encounter_id),
        doctor_id=doctor_id,
        letter_type=letter_type,
        content=letter_html,
    )
    await letter.insert()
    return letter


async def list_letters(encounter_id: str, doctor_id: PydanticObjectId) -> list[Letter]:
    return await Letter.find(
        Letter.encounter_id == PydanticObjectId(encounter_id),
        Letter.doctor_id == doctor_id,
    ).to_list()
