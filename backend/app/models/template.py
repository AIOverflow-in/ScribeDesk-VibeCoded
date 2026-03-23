from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Template(Document):
    doctor_id: Optional[PydanticObjectId] = None  # None = predefined/global
    name: str
    type: Literal["SOAP", "DISCHARGE", "REFERRAL", "PRESCRIPTION", "CUSTOM"] = "CUSTOM"
    content: str = ""
    is_predefined: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "templates"
        indexes = [
            IndexModel([("doctor_id", ASCENDING)]),
        ]
