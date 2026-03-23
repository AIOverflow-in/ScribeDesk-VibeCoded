from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from beanie.odm.fields import PydanticObjectId
from app.models.report import Report
from app.services.report_service import generate_report, update_report
from app.dependencies import get_current_user
from app.models.doctor import Doctor

router = APIRouter(prefix="/encounters", tags=["reports"])


class GenerateReportRequest(BaseModel):
    template_id: str


class UpdateReportRequest(BaseModel):
    content: str


def _report_dict(r):
    return {
        "id": str(r.id),
        "encounter_id": str(r.encounter_id),
        "template_id": str(r.template_id) if r.template_id else None,
        "template_name": r.template_name,
        "content": r.content,
        "pdf_url": r.pdf_url,
        "created_at": r.created_at.isoformat(),
    }


@router.post("/{encounter_id}/reports", response_model=dict, status_code=201)
async def create_report(
    encounter_id: str,
    body: GenerateReportRequest,
    current_user: Doctor = Depends(get_current_user),
):
    report = await generate_report(encounter_id, current_user.id, body.template_id)
    return _report_dict(report)


@router.get("/{encounter_id}/reports", response_model=List[dict])
async def list_reports(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    reports = await Report.find(
        Report.encounter_id == PydanticObjectId(encounter_id)
    ).to_list()
    return [_report_dict(r) for r in reports]


@router.put("/reports/{report_id}", response_model=dict)
async def edit_report(
    report_id: str,
    body: UpdateReportRequest,
    current_user: Doctor = Depends(get_current_user),
):
    report = await update_report(report_id, current_user.id, body.content)
    return _report_dict(report)
