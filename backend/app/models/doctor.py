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
    letterhead_text: Optional[str] = None
    role: Literal["DOCTOR", "SUPER_ADMIN"] = "DOCTOR"
    is_active: bool = True
    # Account lockout (HIPAA § 164.312(d))
    failed_login_count: int = 0
    locked_until: Optional[datetime] = None
    # Compliance
    baa_accepted_at: Optional[datetime] = None    # Business Associate Agreement (HIPAA)
    data_region: str = "us"                       # "us" or "uk" — for data residency
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "doctors"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
        ]
