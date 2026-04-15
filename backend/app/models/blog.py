from beanie import Document
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime
from pymongo import IndexModel, ASCENDING


class BlogPost(Document):
    slug: str
    title: str
    meta_description: str              # 150–160 chars
    content_html: str                  # h2/h3/p/ul/li only — no inline styles
    excerpt: str                       # 2–3 sentences for listing cards
    tags: list[str] = Field(default_factory=list)
    target_keyword: str
    reading_time_mins: int = 5
    status: Literal["published", "draft"] = "draft"
    published_at: Optional[datetime] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "blog_posts"
        indexes = [
            IndexModel([("slug", ASCENDING)], unique=True),
            IndexModel([("status", ASCENDING), ("published_at", ASCENDING)]),
        ]
