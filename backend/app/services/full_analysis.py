import asyncio
import logging
from datetime import datetime, timedelta
from beanie.odm.fields import PydanticObjectId
from app.models.encounter import Encounter
from app.models.clinical_summary import ClinicalSummary, Vitals
from app.models.prescription import Prescription, Medication
from app.models.task import Task
from app.services.llm_service import chat_completion, parse_json_response
from app.services.prompts import (
    clinical_summary_messages, vitals_extraction_messages,
    prescription_messages, task_extraction_messages,
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

    await ws_manager.send_json(encounter_id, {
        "type": "PROCESSING_STARTED",
        "payload": {"message": "Running final AI analysis..."}
    })

    # Run 4 LLM calls concurrently with 90s timeout
    try:
        results = await asyncio.wait_for(
            asyncio.gather(
                _run_summary(transcript, specialization),
                _run_vitals(transcript),
                _run_prescription(transcript, ""),
                _run_tasks(transcript),
                return_exceptions=True,
            ),
            timeout=90.0,
        )
    except asyncio.TimeoutError:
        logger.error(f"Full analysis timed out for encounter {encounter_id}")
        results = [None, None, None, None]

    summary_data, vitals_data, rx_data, tasks_data = results

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

    # Save prescription
    rx_id = None
    if rx_data and not isinstance(rx_data, Exception):
        meds = [Medication(**m) for m in rx_data.get("medications", []) if m.get("name")]
        if meds:
            rx = Prescription(
                encounter_id=PydanticObjectId(encounter_id),
                medications=meds,
            )
            await rx.insert()
            rx_id = str(rx.id)
    else:
        logger.warning(f"Prescription failed for encounter {encounter_id}: {rx_data}")

    # Save tasks
    task_ids = []
    if tasks_data and not isinstance(tasks_data, Exception):
        for t in tasks_data.get("tasks", []):
            due_date = None
            if t.get("due_in_days"):
                due_date = datetime.utcnow() + timedelta(days=int(t["due_in_days"]))
            task = Task(
                doctor_id=doctor_id,
                encounter_id=PydanticObjectId(encounter_id),
                title=t.get("title", "Follow-up"),
                description=t.get("description"),
                due_date=due_date,
            )
            await task.insert()
            task_ids.append(str(task.id))
    else:
        logger.warning(f"Task extraction failed for encounter {encounter_id}: {tasks_data}")

    # Broadcast final results
    await ws_manager.send_json(encounter_id, {
        "type": "FINAL_ANALYSIS",
        "payload": {
            "summary": summary_data if summary_data and not isinstance(summary_data, Exception) else None,
            "vitals": vitals_data if vitals_data and not isinstance(vitals_data, Exception) else None,
            "prescriptions": rx_data.get("medications", []) if rx_data and not isinstance(rx_data, Exception) else [],
            "tasks": tasks_data.get("tasks", []) if tasks_data and not isinstance(tasks_data, Exception) else [],
            "summary_id": summary_id,
            "prescription_id": rx_id,
            "task_ids": task_ids,
        }
    })


async def _run_summary(transcript: str, specialization: str) -> dict:
    text = await chat_completion(
        clinical_summary_messages(transcript, specialization),
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


