from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class CreateTemplateRequest(BaseModel):
    name: str
    type: Literal["SOAP", "DISCHARGE", "REFERRAL", "PRESCRIPTION", "CUSTOM"] = "CUSTOM"
    content: str


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None


class TemplateResponse(BaseModel):
    id: str
    doctor_id: Optional[str] = None
    name: str
    type: str
    content: str
    is_predefined: bool
    created_at: datetime

    model_config = {"from_attributes": True}
