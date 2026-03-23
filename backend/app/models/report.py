from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from typing import Optional
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Report(Document):
    encounter_id: PydanticObjectId
    template_id: Optional[PydanticObjectId] = None
    template_name: Optional[str] = None
    content: str = ""
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "reports"
        indexes = [
            IndexModel([("encounter_id", ASCENDING)]),
        ]
