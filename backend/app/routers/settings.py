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


@router.patch("/me")
async def update_profile(
    body: UpdateProfileRequest,
    current_user: Doctor = Depends(get_current_user),
):
    if body.name:
        current_user.name = body.name
    if body.phone is not None:
        current_user.phone = body.phone
    if body.specialization is not None:
        current_user.specialization = body.specialization
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "specialization": current_user.specialization,
        "role": current_user.role,
    }
