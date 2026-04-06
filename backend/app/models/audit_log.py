from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime
from pymongo import IndexModel, ASCENDING, DESCENDING


class AuditLog(Document):
    """
    Immutable PHI access log. Required for HIPAA § 164.312(b) and UK DSPT.
    Every create/read/update/delete of patient data must be logged here.
    """
    doctor_id: Optional[PydanticObjectId] = None   # None for unauthenticated/system events
    doctor_email: Optional[str] = None
    action: str                                     # e.g. "VIEW_ENCOUNTER", "EXPORT_PATIENT"
    resource_type: str                              # e.g. "encounter", "patient", "clinical_summary"
    resource_id: Optional[str] = None
    patient_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    outcome: Literal["success", "failure", "denied"] = "success"
    detail: Optional[str] = None                   # extra context for the event
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "audit_logs"
        # Immutable — no updates allowed, only inserts
        indexes = [
            IndexModel([("doctor_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("patient_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
            IndexModel([("resource_type", ASCENDING), ("timestamp", DESCENDING)]),
        ]
