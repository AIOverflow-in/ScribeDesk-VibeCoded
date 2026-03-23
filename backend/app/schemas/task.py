from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    encounter_id: Optional[str] = None


class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[Literal["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]] = None


class TaskResponse(BaseModel):
    id: str
    doctor_id: str
    encounter_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
