from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class TranscriptSegment(Document):
    encounter_id: PydanticObjectId
    speaker: str = "UNKNOWN"  # SPEAKER_0, SPEAKER_1, UNKNOWN
    text: str
    start_time: float = 0.0
    end_time: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "transcript_segments"
        indexes = [
            IndexModel([("encounter_id", ASCENDING)]),
        ]
