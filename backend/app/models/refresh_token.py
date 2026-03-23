from beanie import Document
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class RefreshToken(Document):
    user_id: PydanticObjectId
    token_hash: str
    expires_at: datetime
    revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "refresh_tokens"
        indexes = [
            IndexModel([("token_hash", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("expires_at", ASCENDING)]),
        ]
