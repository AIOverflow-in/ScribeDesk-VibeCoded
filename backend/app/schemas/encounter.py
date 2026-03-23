from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StartEncounterRequest(BaseModel):
    patient_id: str


class EncounterResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    transcript_text: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}
