from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Letter(Document):
    encounter_id: PydanticObjectId
    doctor_id: PydanticObjectId
    letter_type: Literal["referral", "sick_note", "patient_instructions"]
    content: str  # HTML content
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "letters"
        indexes = [
            IndexModel([("encounter_id", ASCENDING)]),
            IndexModel([("doctor_id", ASCENDING)]),
        ]
