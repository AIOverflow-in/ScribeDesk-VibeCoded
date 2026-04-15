"""Public blog endpoints + admin generation trigger."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.blog import BlogPost
from app.models.doctor import Doctor
from app.dependencies import require_role

router = APIRouter(prefix="/blogs", tags=["blogs"])
_admin_guard = require_role("SUPER_ADMIN")


def _summary(post: BlogPost) -> dict:
    return {
        "id": str(post.id),
        "slug": post.slug,
        "title": post.title,
        "excerpt": post.excerpt,
        "tags": post.tags,
        "target_keyword": post.target_keyword,
        "reading_time_mins": post.reading_time_mins,
        "published_at": post.published_at.isoformat() if post.published_at else None,
    }


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[dict])
async def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
):
    """List published blog posts, newest first."""
    skip = (page - 1) * limit
    posts = (
        await BlogPost.find(BlogPost.status == "published")
        .sort(-BlogPost.published_at)
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return [_summary(p) for p in posts]


@router.get("/{slug}", response_model=dict)
async def get_post(slug: str):
    """Get a single published blog post by slug."""
    post = await BlogPost.find_one(
        BlogPost.slug == slug,
        BlogPost.status == "published",
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {
        **_summary(post),
        "meta_description": post.meta_description,
        "content_html": post.content_html,
    }


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=dict, status_code=201)
async def trigger_generation(_: Doctor = Depends(_admin_guard)):
    """Manually trigger blog post generation (SUPER_ADMIN only)."""
    from app.services.blog_generator import generate_blog_post
    try:
        post = await generate_blog_post()
        return {"slug": post.slug, "title": post.title, "published_at": post.published_at.isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")


@router.get("/admin/all", response_model=list[dict])
async def list_all_posts(
    _: Doctor = Depends(_admin_guard),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List all posts including drafts (SUPER_ADMIN only)."""
    skip = (page - 1) * limit
    posts = (
        await BlogPost.find()
        .sort(-BlogPost.generated_at)
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return [
        {**_summary(p), "status": p.status, "generated_at": p.generated_at.isoformat()}
        for p in posts
    ]
