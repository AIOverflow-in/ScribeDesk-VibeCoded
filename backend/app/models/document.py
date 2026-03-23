from beanie import Document as BeanieDocument
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from typing import Optional
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Document(BeanieDocument):
    patient_id: PydanticObjectId
    file_url: str
    file_name: str
    file_type: Optional[str] = None
    size_bytes: Optional[int] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "documents"
        indexes = [
            IndexModel([("patient_id", ASCENDING)]),
        ]
