import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import Request
from app.models.doctor import Doctor
from app.models.refresh_token import RefreshToken
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    decode_token, refresh_token_expires_at
)
from app.core.exceptions import UnauthorizedError
from app.services.audit_service import log_login, log_phi_access
from beanie.odm.fields import PydanticObjectId

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 30


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def login(email: str, password: str, request: Optional[Request] = None) -> dict:
    doctor = await Doctor.find_one(Doctor.email == email)

    # Unknown email — log and reject (don't reveal whether email exists)
    if not doctor:
        await log_login(email, outcome="failure", request=request, detail="Unknown email")
        raise UnauthorizedError("Invalid email or password")

    # Account locked?
    if doctor.locked_until and doctor.locked_until > datetime.now(timezone.utc):
        remaining = int((doctor.locked_until - datetime.now(timezone.utc)).total_seconds() / 60)
        await log_login(email, outcome="denied", request=request, detail="Account locked")
        raise UnauthorizedError(f"Account locked. Try again in {remaining} minutes.")

    # Wrong password
    if not verify_password(password, doctor.password_hash):
        doctor.failed_login_count = (doctor.failed_login_count or 0) + 1
        if doctor.failed_login_count >= MAX_FAILED_ATTEMPTS:
            doctor.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
            await doctor.save()
            await log_login(email, outcome="denied", request=request, detail=f"Account locked after {MAX_FAILED_ATTEMPTS} failed attempts")
            raise UnauthorizedError(f"Too many failed attempts. Account locked for {LOCKOUT_MINUTES} minutes.")
        await doctor.save()
        await log_login(email, outcome="failure", request=request, detail=f"Bad password (attempt {doctor.failed_login_count})")
        raise UnauthorizedError("Invalid email or password")

    if not doctor.is_active:
        await log_login(email, outcome="denied", request=request, detail="Inactive account")
        raise UnauthorizedError("Account is deactivated")

    # Success — reset lockout counter
    doctor.failed_login_count = 0
    doctor.locked_until = None
    await doctor.save()

    user_id = str(doctor.id)
    access_token = create_access_token(user_id, doctor.role)
    refresh_token = create_refresh_token(user_id, doctor.role)

    rt = RefreshToken(
        user_id=doctor.id,
        token_hash=_hash_token(refresh_token),
        expires_at=refresh_token_expires_at(),
    )
    await rt.insert()

    await log_login(email, outcome="success", request=request)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": doctor.name,
            "email": doctor.email,
            "role": doctor.role,
            "phone": doctor.phone,
            "specialization": doctor.specialization,
            "signature_url": getattr(doctor, "signature_url", None),
            "clinic_logo_url": getattr(doctor, "clinic_logo_url", None),
            "letterhead_text": getattr(doctor, "letterhead_text", None),
            "baa_accepted_at": doctor.baa_accepted_at.isoformat() if doctor.baa_accepted_at else None,
        }
    }


async def refresh_access_token(refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid refresh token")

    token_hash = _hash_token(refresh_token)
    stored = await RefreshToken.find_one(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked == False,
    )
    if not stored or stored.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError("Refresh token expired or revoked")

    doctor = await Doctor.get(stored.user_id)
    if not doctor or not doctor.is_active:
        raise UnauthorizedError("User not found or deactivated")

    new_access = create_access_token(str(doctor.id), doctor.role)
    return {"access_token": new_access, "token_type": "bearer"}


async def logout(refresh_token: str):
    token_hash = _hash_token(refresh_token)
    stored = await RefreshToken.find_one(RefreshToken.token_hash == token_hash)
    if stored:
        stored.revoked = True
        await stored.save()
