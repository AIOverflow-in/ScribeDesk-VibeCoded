import asyncio
import logging
from datetime import datetime, timezone
from beanie.odm.fields import PydanticObjectId
from app.models.encounter import Encounter
from app.models.clinical_summary import ClinicalSummary, Vitals
from app.models.prescription import Prescription, Medication
from app.models.template import Template
from app.services.llm_service import chat_completion, parse_json_response
from app.services.prompts import (
    clinical_summary_messages, vitals_extraction_messages,
    prescription_messages,
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

    # Run 2 LLM calls concurrently (prescription triggered manually, tasks handled via plan section)
    try:
        results = await asyncio.wait_for(
            asyncio.gather(
                _run_summary(transcript, specialization, template_content),
                _run_vitals(transcript),
                return_exceptions=True,
            ),
            timeout=90.0,
        )
    except asyncio.TimeoutError:
        logger.error(f"Full analysis timed out for encounter {encounter_id}")
        results = [None, None]

    summary_data, vitals_data = results

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
        await summary.insert()
        summary_id = str(summary.id)
    else:
        logger.warning(f"Summary failed for encounter {encounter_id}: {summary_data}")

    # Broadcast final results (prescription triggered manually, follow-ups live in the plan section)
    await ws_manager.send_json(encounter_id, {
        "type": "FINAL_ANALYSIS",
        "payload": {
            "summary": summary_data if summary_data and not isinstance(summary_data, Exception) else None,
            "vitals": vitals_data if vitals_data and not isinstance(vitals_data, Exception) else None,
            "prescriptions": [],
            "summary_id": summary_id,
        }
    })


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


async def _run_tasks(transcript: str) -> dict:
    text = await chat_completion(task_extraction_messages(transcript), json_mode=True)
    return await parse_json_response(text)


