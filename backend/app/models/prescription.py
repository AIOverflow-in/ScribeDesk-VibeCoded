from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Medication(BaseModel):
    name: str
    dosage: str = ""
    frequency: str = ""
    duration: str = ""
    instructions: Optional[str] = None
    is_suggested: bool = True


class Prescription(Document):
    encounter_id: PydanticObjectId
    medications: List[Medication] = Field(default_factory=list)
    approved: bool = False
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "prescriptions"
        indexes = [
            IndexModel([("encounter_id", ASCENDING)]),
        ]
