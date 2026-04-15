"""Automated SEO blog post generation service."""
import logging
import re
from datetime import datetime, timezone

from app.models.blog import BlogPost
from app.services.llm_service import chat_completion, parse_json_response
from app.services.prompts import blog_generation_messages

logger = logging.getLogger(__name__)


async def _get_published_titles() -> list[str]:
    posts = await BlogPost.find(BlogPost.status == "published").to_list()
    return [p.title for p in posts]


async def _make_unique_slug(base: str) -> str:
    """Derive a URL-safe slug from title and ensure it is unique in the DB."""
    slug = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")[:80]
    candidate = slug
    suffix = 2
    while await BlogPost.find_one(BlogPost.slug == candidate):
        candidate = f"{slug}-{suffix}"
        suffix += 1
    return candidate


def _reading_time(html: str) -> int:
    text = re.sub(r"<[^>]+>", " ", html)
    words = len(text.split())
    return max(2, round(words / 200))


async def generate_blog_post() -> BlogPost:
    """
    Generate and publish one SEO blog post.
    Called by the APScheduler job and the admin manual-trigger endpoint.
    """
    existing_titles = await _get_published_titles()
    messages = blog_generation_messages(existing_titles)

    raw = await chat_completion(messages, json_mode=True)
    data = await parse_json_response(raw)

    title: str = data["title"]
    slug = await _make_unique_slug(title)
    reading_time = _reading_time(data.get("content_html", ""))

    post = BlogPost(
        slug=slug,
        title=title,
        meta_description=data["meta_description"],
        content_html=data["content_html"],
        excerpt=data["excerpt"],
        tags=data.get("tags", []),
        target_keyword=data.get("target_keyword", ""),
        reading_time_mins=reading_time,
        status="published",
        published_at=datetime.now(timezone.utc),
    )
    await post.insert()
    logger.info(f"Blog post published: {post.slug}")
    return post
