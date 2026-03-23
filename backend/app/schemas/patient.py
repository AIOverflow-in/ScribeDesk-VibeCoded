from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CreatePatientRequest(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    gender: Optional[str] = None


class UpdatePatientRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    gender: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    doctor_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
