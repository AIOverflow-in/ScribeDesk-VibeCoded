import asyncio
import logging
from datetime import datetime, timezone
from beanie.odm.fields import PydanticObjectId
from app.models.encounter import Encounter
from app.models.clinical_summary import ClinicalSummary, Vitals, BillingCode, DrugInteraction
from app.models.prescription import Prescription, Medication
from app.models.template import Template
from app.services.llm_service import chat_completion, parse_json_response
from app.services.prompts import (
    clinical_summary_messages, vitals_extraction_messages,
    prescription_messages, billing_extraction_messages,
    patient_summary_messages, drug_interaction_messages,
    evidence_messages,
)
from app.core.websocket_manager import ws_manager

logger = logging.getLogger(__name__)


async def run_full_analysis(encounter_id: str, doctor_id: PydanticObjectId, specialization: str = "General Physician"):
    """Run parallel LLM analysis after session finish. Non-fatal on individual failures."""
    encounter = await Encounter.get(PydanticObjectId(encounter_id))
    if not encounter:
        return

    transcript = encounter.transcript_text
    if not transcript.strip():
        await ws_manager.send_json(encounter_id, {
            "type": "FINAL_ANALYSIS",
            "payload": {"error": "No transcript available for analysis"}
        })
        return

    # Fetch template content if one was selected for this encounter
    template_content = None
    if encounter.template_id:
        tmpl = await Template.get(encounter.template_id)
        if tmpl:
            template_content = tmpl.content

    await ws_manager.send_json(encounter_id, {
        "type": "PROCESSING_STARTED",
        "payload": {"message": "Running final AI analysis..."}
    })

    # Run summary + vitals concurrently first (needed for billing/patient summary)
    try:
        core_results = await asyncio.wait_for(
            asyncio.gather(
                _run_summary(transcript, specialization, template_content),
                _run_vitals(transcript),
                return_exceptions=True,
            ),
            timeout=90.0,
        )
    except asyncio.TimeoutError:
        logger.error(f"Full analysis timed out for encounter {encounter_id}")
        core_results = [None, None]

    summary_data, vitals_data = core_results
    summary_text = summary_data.get("summary_text", "") if summary_data and not isinstance(summary_data, Exception) else ""
    summary_str = str(summary_data) if summary_data and not isinstance(summary_data, Exception) else ""

    # Run billing, patient summary, evidence concurrently
    try:
        secondary_results = await asyncio.wait_for(
            asyncio.gather(
                _run_billing(transcript, summary_str) if summary_text else _noop(),
                _run_patient_summary(transcript, summary_str, "") if summary_text else _noop(),
                _run_evidence(summary_data.get("diagnosis", []), specialization) if (summary_data and not isinstance(summary_data, Exception)) else _noop(),
                return_exceptions=True,
            ),
            timeout=60.0,
        )
    except asyncio.TimeoutError:
        logger.warning(f"Secondary analysis timed out for encounter {encounter_id}")
        secondary_results = [None, None, None]

    billing_data, patient_summary_data, evidence_data = secondary_results

    # Save clinical summary
    summary_id = None
    if summary_data and not isinstance(summary_data, Exception):
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

        # Attach billing codes
        if billing_data and not isinstance(billing_data, Exception):
            summary.billing_codes = [
                BillingCode(**c) for c in billing_data.get("billing_codes", [])
                if c.get("code") and c.get("description")
            ]

        # Attach patient summary
        if patient_summary_data and not isinstance(patient_summary_data, Exception):
            summary.patient_summary = patient_summary_data.get("patient_summary")

        # Attach evidence
        if evidence_data and not isinstance(evidence_data, Exception):
            summary.evidence = evidence_data.get("evidence", [])

        await summary.insert()
        summary_id = str(summary.id)
    else:
        logger.warning(f"Summary failed for encounter {encounter_id}: {summary_data}")

    # Broadcast final results
    await ws_manager.send_json(encounter_id, {
        "type": "FINAL_ANALYSIS",
        "payload": {
            "summary": summary_data if summary_data and not isinstance(summary_data, Exception) else None,
            "vitals": vitals_data if vitals_data and not isinstance(vitals_data, Exception) else None,
            "prescriptions": [],
            "summary_id": summary_id,
        }
    })


async def _noop() -> dict:
    return {}


async def _run_summary(transcript: str, specialization: str, template_content: str | None = None) -> dict:
    text = await chat_completion(
        clinical_summary_messages(transcript, specialization, template_content),
        json_mode=True,
    )
    return await parse_json_response(text)


async def _run_vitals(transcript: str) -> dict:
    text = await chat_completion(vitals_extraction_messages(transcript), json_mode=True)
    return await parse_json_response(text)


async def _run_prescription(transcript: str, summary: str) -> dict:
    text = await chat_completion(prescription_messages(transcript, summary), json_mode=True)
    return await parse_json_response(text)


async def _run_billing(transcript: str, summary: str) -> dict:
    text = await chat_completion(billing_extraction_messages(transcript, summary), json_mode=True)
    return await parse_json_response(text)


async def _run_patient_summary(transcript: str, summary: str, medications: str) -> dict:
    text = await chat_completion(patient_summary_messages(transcript, summary, medications), json_mode=True)
    return await parse_json_response(text)


async def _run_evidence(diagnoses: list, specialization: str) -> dict:
    if not diagnoses:
        return {"evidence": []}
    text = await chat_completion(evidence_messages(diagnoses, specialization), json_mode=True)
    return await parse_json_response(text)
