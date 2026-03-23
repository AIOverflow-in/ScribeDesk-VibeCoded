from fastapi import APIRouter, Depends
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, AccessTokenResponse, DoctorProfile
from app.services import auth_service
from app.dependencies import get_current_user
from app.models.doctor import Doctor

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=dict)
async def login(body: LoginRequest):
    return await auth_service.login(body.email, body.password)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest):
    return await auth_service.refresh_access_token(body.refresh_token)


@router.post("/logout")
async def logout(body: RefreshRequest):
    await auth_service.logout(body.refresh_token)
    return {"message": "Logged out successfully"}


@router.get("/me")
async def me(current_user: Doctor = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "specialization": current_user.specialization,
        "signature_url": current_user.signature_url,
        "role": current_user.role,
    }
