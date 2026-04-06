from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class Vitals(BaseModel):
    blood_pressure: Optional[str] = None
    heart_rate: Optional[str] = None
    temperature: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    spo2: Optional[str] = None
    respiratory_rate: Optional[str] = None


class BillingCode(BaseModel):
    code: str
    description: str
    type: str  # "ICD-10" or "CPT"
    confidence: str  # "high" | "medium" | "low"
    accepted: bool = True


class DrugInteraction(BaseModel):
    drug_a: str
    drug_b: str
    severity: str  # "Minor" | "Moderate" | "Major"
    mechanism: str
    management: str


class ClinicalSummary(Document):
    encounter_id: PydanticObjectId
    chief_complaint: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    physical_examination: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    summary_text: str = ""
    vitals: Optional[Vitals] = None
    diagnosis: List[str] = Field(default_factory=list)
    billing_codes: List[BillingCode] = Field(default_factory=list)
    patient_summary: Optional[str] = None  # plain-English after-visit summary
    drug_interactions: List[DrugInteraction] = Field(default_factory=list)
    attested: bool = False
    attested_at: Optional[datetime] = None
    evidence: List[str] = Field(default_factory=list)  # evidence-based suggestions
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "clinical_summaries"
        indexes = [
            IndexModel([("encounter_id", ASCENDING)]),
        ]
