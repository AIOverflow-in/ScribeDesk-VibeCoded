from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.models.doctor import Doctor
from beanie.odm.fields import PydanticObjectId

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Doctor:
    if not credentials:
        raise UnauthorizedError("No token provided")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token")

    user_id = payload.get("sub")
    doctor = await Doctor.get(PydanticObjectId(user_id))
    if not doctor:
        raise UnauthorizedError("User not found")
    if not doctor.is_active:
        raise ForbiddenError("Account is deactivated")

    return doctor


def require_role(*roles: str):
    async def checker(current_user: Doctor = Depends(get_current_user)) -> Doctor:
        if current_user.role not in roles:
            raise ForbiddenError(f"Required role: {', '.join(roles)}")
        return current_user
    return checker
