from fastapi import APIRouter, Depends
from typing import List
from app.schemas.template import CreateTemplateRequest, UpdateTemplateRequest
from app.services import template_service
from app.dependencies import get_current_user
from app.models.doctor import Doctor

router = APIRouter(prefix="/templates", tags=["templates"])


def _tmpl_dict(t):
    return {
        "id": str(t.id),
        "doctor_id": str(t.doctor_id) if t.doctor_id else None,
        "name": t.name,
        "type": t.type,
        "content": t.content,
        "is_predefined": t.is_predefined,
        "created_at": t.created_at.isoformat(),
    }


@router.get("", response_model=List[dict])
async def list_templates(current_user: Doctor = Depends(get_current_user)):
    templates = await template_service.list_templates(current_user.id)
    return [_tmpl_dict(t) for t in templates]


@router.post("", response_model=dict, status_code=201)
async def create_template(
    body: CreateTemplateRequest,
    current_user: Doctor = Depends(get_current_user),
):
    template = await template_service.create_template(
        current_user.id, body.name, body.type, body.content
    )
    return _tmpl_dict(template)


@router.put("/{template_id}", response_model=dict)
async def update_template(
    template_id: str,
    body: UpdateTemplateRequest,
    current_user: Doctor = Depends(get_current_user),
):
    template = await template_service.update_template(
        template_id, current_user.id, **body.model_dump(exclude_none=True)
    )
    return _tmpl_dict(template)


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    await template_service.delete_template(template_id, current_user.id)
