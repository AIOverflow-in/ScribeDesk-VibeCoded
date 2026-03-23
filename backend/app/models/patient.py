from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from typing import Optional
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Patient(Document):
    doctor_id: PydanticObjectId
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "patients"
        indexes = [
            IndexModel([("doctor_id", ASCENDING), ("name", ASCENDING), ("phone", ASCENDING)]),
        ]
