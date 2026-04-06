from fastapi import APIRouter, Depends, Request
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, AccessTokenResponse, DoctorProfile
from app.services import auth_service
from app.dependencies import get_current_user
from app.models.doctor import Doctor
from app.services.audit_service import log_phi_access
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=dict)
async def login(body: LoginRequest, request: Request):
    return await auth_service.login(body.email, body.password, request)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest):
    return await auth_service.refresh_access_token(body.refresh_token)


@router.post("/logout")
async def logout(body: RefreshRequest):
    await auth_service.logout(body.refresh_token)
    return {"message": "Logged out successfully"}


@router.post("/accept-baa")
async def accept_baa(
    request: Request,
    current_user: Doctor = Depends(get_current_user),
):
    """Doctor accepts the Business Associate Agreement (HIPAA requirement)."""
    current_user.baa_accepted_at = datetime.now(timezone.utc)
    await current_user.save()
    await log_phi_access(
        action="ACCEPT_BAA",
        resource_type="auth",
        doctor_id=current_user.id,
        doctor_email=current_user.email,
        request=request,
    )
    return {"baa_accepted_at": current_user.baa_accepted_at.isoformat()}


@router.get("/me")
async def me(current_user: Doctor = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "specialization": current_user.specialization,
        "signature_url": current_user.signature_url,
        "clinic_logo_url": current_user.clinic_logo_url,
        "letterhead_text": current_user.letterhead_text,
        "role": current_user.role,
    }
