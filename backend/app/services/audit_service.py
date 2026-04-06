"""
PHI audit logging service.
Call log_phi_access() from any router that touches patient data.
Failures are swallowed so a logging error never breaks the clinical workflow.
"""
import logging
from typing import Optional
from fastapi import Request
from beanie.odm.fields import PydanticObjectId
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


async def log_phi_access(
    action: str,
    resource_type: str,
    doctor_id: Optional[PydanticObjectId] = None,
    doctor_email: Optional[str] = None,
    resource_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    request: Optional[Request] = None,
    outcome: str = "success",
    detail: Optional[str] = None,
):
    """Log a PHI access event. Never raises — logging must not break clinical workflow."""
    try:
        ip = None
        ua = None
        if request:
            forwarded = request.headers.get("X-Forwarded-For")
            ip = forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else None
            ua = request.headers.get("User-Agent", "")[:256]

        entry = AuditLog(
            doctor_id=doctor_id,
            doctor_email=doctor_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            patient_id=patient_id,
            ip_address=ip,
            user_agent=ua,
            outcome=outcome,
            detail=detail,
        )
        await entry.insert()
    except Exception as e:
        logger.error(f"Audit log failed (non-fatal): {e}")


async def log_login(
    email: str,
    outcome: str,
    request: Optional[Request] = None,
    detail: Optional[str] = None,
):
    await log_phi_access(
        action="LOGIN",
        resource_type="auth",
        doctor_email=email,
        request=request,
        outcome=outcome,
        detail=detail,
    )
