from datetime import datetime
from typing import List, Optional
from beanie.odm.fields import PydanticObjectId
from app.models.template import Template
from app.core.exceptions import NotFoundError, ForbiddenError


async def list_templates(doctor_id: PydanticObjectId) -> List[Template]:
    # Return predefined + doctor's own templates
    return await Template.find(
        {"$or": [{"doctor_id": doctor_id}, {"is_predefined": True}]}
    ).sort([("is_predefined", -1), ("created_at", -1)]).to_list()


async def get_template(template_id: str, doctor_id: PydanticObjectId) -> Template:
    template = await Template.get(PydanticObjectId(template_id))
    if not template:
        raise NotFoundError("Template not found")
    if not template.is_predefined and template.doctor_id != doctor_id:
        raise ForbiddenError("Access denied to this template")
    return template


async def create_template(
    doctor_id: PydanticObjectId,
    name: str,
    type: str,
    content: str,
) -> Template:
    template = Template(
        doctor_id=doctor_id,
        name=name,
        type=type,
        content=content,
        is_predefined=False,
    )
    await template.insert()
    return template


async def update_template(template_id: str, doctor_id: PydanticObjectId, **kwargs) -> Template:
    template = await Template.get(PydanticObjectId(template_id))
    if not template:
        raise NotFoundError("Template not found")
    if template.is_predefined:
        raise ForbiddenError("Cannot modify predefined templates")
    if template.doctor_id != doctor_id:
        raise ForbiddenError("Access denied")
    for k, v in kwargs.items():
        if v is not None:
            setattr(template, k, v)
    template.updated_at = datetime.utcnow()
    await template.save()
    return template


async def delete_template(template_id: str, doctor_id: PydanticObjectId):
    template = await Template.get(PydanticObjectId(template_id))
    if not template:
        raise NotFoundError("Template not found")
    if template.is_predefined:
        raise ForbiddenError("Cannot delete predefined templates")
    if template.doctor_id != doctor_id:
        raise ForbiddenError("Access denied")
    await template.delete()
