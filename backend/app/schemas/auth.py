from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DoctorProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None
    specialization: str | None
    signature_url: str | None
    role: str

    model_config = {"from_attributes": True}
