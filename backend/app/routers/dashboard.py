from fastapi import APIRouter, Depends
from app.services.dashboard_service import get_dashboard_metrics
from app.dependencies import get_current_user
from app.models.doctor import Doctor

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
async def metrics(current_user: Doctor = Depends(get_current_user)):
    return await get_dashboard_metrics(current_user.id)
