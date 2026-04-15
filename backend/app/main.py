import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_db, close_db


async def _idle_cleanup_loop() -> None:
    """Background task: clean up processors idle for > 2 hours every 10 minutes."""
    from app.services.processor_registry import cleanup_idle_processors
    while True:
        await asyncio.sleep(600)
        try:
            await cleanup_idle_processors()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Idle processor cleanup error: {e}")


async def _run_seeds() -> None:
    """Run seed scripts in the background so they don't block server startup."""
    try:
        from scripts.seed_templates import seed as seed_templates
        from scripts.seed_admin import seed as seed_admin
        from scripts.seed_demo_data import seed as seed_demo_data
        await seed_templates()
        await seed_admin()
        await seed_demo_data()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Seed error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — connect DB first, then kick off seeds and cleanup as background tasks
    await connect_db()
    asyncio.create_task(_run_seeds())
    cleanup_task = asyncio.create_task(_idle_cleanup_loop())
    yield
    # Shutdown
    cleanup_task.cancel()
    await close_db()


app = FastAPI(
    title="Clinical AI Scribe API",
    description="Backend API for the Clinical AI Scribe MVP",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.routers import auth, patients, encounters, websocket, tasks, templates, reports, chat, dashboard, admin, settings, letters

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(encounters.router)
app.include_router(websocket.router)
app.include_router(tasks.router)
app.include_router(templates.router)
app.include_router(reports.router)
app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(settings.router)
app.include_router(letters.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "scribe-backend"}
