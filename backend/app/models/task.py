from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Task(Document):
    doctor_id: PydanticObjectId
    encounter_id: Optional[PydanticObjectId] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Literal["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] = "PENDING"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "tasks"
        indexes = [
            IndexModel([("doctor_id", ASCENDING), ("status", ASCENDING)]),
            IndexModel([("encounter_id", ASCENDING)]),
        ]
