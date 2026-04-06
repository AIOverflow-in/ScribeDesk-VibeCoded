from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Doctor(Document):
    name: str
    email: str
    phone: Optional[str] = None
    password_hash: str
    specialization: Optional[str] = None
    signature_url: Optional[str] = None
    clinic_logo_url: Optional[str] = None
    letterhead_text: Optional[str] = None  # custom clinic name / address for letters
    role: Literal["DOCTOR", "SUPER_ADMIN"] = "DOCTOR"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "doctors"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
        ]
