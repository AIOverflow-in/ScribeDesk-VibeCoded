import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings

_client: AsyncIOMotorClient | None = None


async def connect_db():
    global _client
    _client = AsyncIOMotorClient(settings.mongodb_url, tlsCAFile=certifi.where())
    db = _client[settings.mongodb_db_name]

    from app.models.doctor import Doctor
    from app.models.patient import Patient
    from app.models.encounter import Encounter
    from app.models.transcript_segment import TranscriptSegment
    from app.models.clinical_summary import ClinicalSummary
    from app.models.prescription import Prescription
    from app.models.report import Report
    from app.models.task import Task
    from app.models.document import Document
    from app.models.template import Template
    from app.models.refresh_token import RefreshToken
    from app.models.letter import Letter
    from app.models.audit_log import AuditLog
    from app.models.blog import BlogPost

    await init_beanie(
        database=db,
        document_models=[
            Doctor, Patient, Encounter, TranscriptSegment,
            ClinicalSummary, Prescription, Report, Task,
            Document, Template, RefreshToken, Letter, AuditLog,
            BlogPost,
        ],
    )


async def close_db():
    global _client
    if _client:
        _client.close()


def get_db():
    return _client[settings.mongodb_db_name]
