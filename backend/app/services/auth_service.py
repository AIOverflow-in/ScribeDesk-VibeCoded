import hashlib
from datetime import datetime
from typing import Optional
from app.models.doctor import Doctor
from app.models.refresh_token import RefreshToken
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    decode_token, refresh_token_expires_at
)
from app.core.exceptions import UnauthorizedError
from beanie.odm.fields import PydanticObjectId


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def login(email: str, password: str) -> dict:
    doctor = await Doctor.find_one(Doctor.email == email)
    if not doctor or not verify_password(password, doctor.password_hash):
        raise UnauthorizedError("Invalid email or password")
    if not doctor.is_active:
        raise UnauthorizedError("Account is deactivated")

    user_id = str(doctor.id)
    access_token = create_access_token(user_id, doctor.role)
    refresh_token = create_refresh_token(user_id, doctor.role)

    # Store hashed refresh token
    rt = RefreshToken(
        user_id=doctor.id,
        token_hash=_hash_token(refresh_token),
        expires_at=refresh_token_expires_at(),
    )
    await rt.insert()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": doctor.name,
            "email": doctor.email,
            "role": doctor.role,
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
    if not stored or stored.expires_at < datetime.utcnow():
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
