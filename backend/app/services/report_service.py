from datetime import datetime
from beanie.odm.fields import PydanticObjectId
from app.models.report import Report
from app.models.encounter import Encounter
from app.models.clinical_summary import ClinicalSummary
from app.models.prescription import Prescription
from app.models.template import Template
from app.services.llm_service import chat_completion
from app.services.prompts import report_fill_messages
from app.core.exceptions import NotFoundError
import json


async def generate_report(encounter_id: str, doctor_id: PydanticObjectId, template_id: str) -> Report:
    encounter = await Encounter.get(PydanticObjectId(encounter_id))
    if not encounter or encounter.doctor_id != doctor_id:
        raise NotFoundError("Encounter not found")

    template = await Template.get(PydanticObjectId(template_id))
    if not template:
        raise NotFoundError("Template not found")

    summary = await ClinicalSummary.find_one(
        ClinicalSummary.encounter_id == PydanticObjectId(encounter_id)
    )
    summary_text = ""
    if summary:
        summary_text = f"Chief Complaint: {summary.chief_complaint}\nAssessment: {summary.assessment}\nPlan: {summary.plan}"

    vitals_text = ""
    if summary and summary.vitals:
        vitals_text = json.dumps(summary.vitals.model_dump(exclude_none=True), indent=2)

    rx = await Prescription.find_one(
        Prescription.encounter_id == PydanticObjectId(encounter_id)
    )
    rx_text = ""
    if rx:
        rx_text = "\n".join(
            f"- {m.name} {m.dosage}, {m.frequency} for {m.duration}" for m in rx.medications
        )

    messages = report_fill_messages(template.content, summary_text, vitals_text, rx_text)
    content = await chat_completion(messages)

    report = Report(
        encounter_id=PydanticObjectId(encounter_id),
        template_id=PydanticObjectId(template_id),
        template_name=template.name,
        content=content,
    )
    await report.insert()
    return report


async def update_report(report_id: str, doctor_id: PydanticObjectId, content: str) -> Report:
    report = await Report.get(PydanticObjectId(report_id))
    if not report:
        raise NotFoundError("Report not found")
    # Verify doctor owns the encounter
    encounter = await Encounter.get(report.encounter_id)
    if not encounter or encounter.doctor_id != doctor_id:
        raise NotFoundError("Report not found")
    report.content = content
    report.updated_at = datetime.utcnow()
    await report.save()
    return report
