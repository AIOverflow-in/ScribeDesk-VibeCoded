from pydantic import BaseModel
from typing import List, Optional


class ChatHistoryItem(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatHistoryItem]] = []
