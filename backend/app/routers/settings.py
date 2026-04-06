from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_current_user
from app.models.doctor import Doctor

router = APIRouter(prefix="/doctors", tags=["settings"])


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    signature_url: Optional[str] = None
    clinic_logo_url: Optional[str] = None
    letterhead_text: Optional[str] = None


def _doctor_dict(d: Doctor) -> dict:
    return {
        "id": str(d.id),
        "name": d.name,
        "email": d.email,
        "phone": d.phone,
        "specialization": d.specialization,
        "signature_url": d.signature_url,
        "clinic_logo_url": d.clinic_logo_url,
        "letterhead_text": d.letterhead_text,
        "role": d.role,
    }


@router.get("/me")
async def get_profile(current_user: Doctor = Depends(get_current_user)):
    return _doctor_dict(current_user)


@router.patch("/me")
async def update_profile(
    body: UpdateProfileRequest,
    current_user: Doctor = Depends(get_current_user),
):
    if body.name is not None:
        current_user.name = body.name
    if body.phone is not None:
        current_user.phone = body.phone
    if body.specialization is not None:
        current_user.specialization = body.specialization
    if body.signature_url is not None:
        current_user.signature_url = body.signature_url
    if body.clinic_logo_url is not None:
        current_user.clinic_logo_url = body.clinic_logo_url
    if body.letterhead_text is not None:
        current_user.letterhead_text = body.letterhead_text
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return _doctor_dict(current_user)
