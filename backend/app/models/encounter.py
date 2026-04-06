from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Encounter(Document):
    doctor_id: PydanticObjectId
    patient_id: PydanticObjectId
    status: Literal["CREATED", "ACTIVE", "PAUSED", "FINISHED"] = "CREATED"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    transcript_text: str = ""
    audio_url: Optional[str] = None
    template_id: Optional[PydanticObjectId] = None
    language: str = "en"  # BCP-47 language code for transcription
    share_token: Optional[str] = None  # for read-only sharing
    shared_with: list = Field(default_factory=list)  # list of doctor_ids
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "encounters"
        indexes = [
            IndexModel([("doctor_id", ASCENDING)]),
            IndexModel([("patient_id", ASCENDING)]),
            IndexModel([("doctor_id", ASCENDING), ("status", ASCENDING)]),
        ]
