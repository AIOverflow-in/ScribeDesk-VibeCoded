from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CreateDoctorRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    specialization: Optional[str] = None


class UpdateDoctorRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None


class DoctorStatusRequest(BaseModel):
    is_active: bool


class ResetPasswordRequest(BaseModel):
    new_password: str


class DoctorResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    specialization: Optional[str] = None
    signature_url: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DoctorMetrics(BaseModel):
    total_patients: int
    total_encounters: int
    reports_generated: int
    last_activity: Optional[datetime] = None
