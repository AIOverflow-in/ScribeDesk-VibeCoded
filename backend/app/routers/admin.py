from fastapi import APIRouter, Depends, Query
from datetime import datetime
from typing import Optional
from app.schemas.doctor import CreateDoctorRequest, UpdateDoctorRequest, DoctorStatusRequest, ResetPasswordRequest
from app.models.doctor import Doctor
from app.models.encounter import Encounter
from app.models.patient import Patient
from app.models.report import Report
from app.core.security import hash_password
from app.core.exceptions import ConflictError, NotFoundError
from app.dependencies import require_role

router = APIRouter(prefix="/admin", tags=["admin"])
admin_guard = require_role("SUPER_ADMIN")


def _doc_dict(d):
    return {
        "id": str(d.id),
        "name": d.name,
        "email": d.email,
        "phone": d.phone,
        "specialization": d.specialization,
        "role": d.role,
        "is_active": d.is_active,
        "created_at": d.created_at.isoformat(),
    }


@router.post("/doctors", response_model=dict, status_code=201)
async def create_doctor(
    body: CreateDoctorRequest,
    _: Doctor = Depends(admin_guard),
):
    existing = await Doctor.find_one(Doctor.email == body.email)
    if existing:
        raise ConflictError("Email already registered")

    doctor = Doctor(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        specialization=body.specialization,
        role="DOCTOR",
    )
    await doctor.insert()
    return _doc_dict(doctor)


@router.get("/doctors", response_model=list)
async def list_doctors(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    _: Doctor = Depends(admin_guard),
):
    import re
    query = Doctor.find(Doctor.role == "DOCTOR")
    if search:
        pattern = re.compile(search, re.IGNORECASE)
        query = Doctor.find(Doctor.role == "DOCTOR", {"$or": [{"name": pattern}, {"email": pattern}]})
    skip = (page - 1) * limit
    doctors = await query.skip(skip).limit(limit).to_list()
    return [_doc_dict(d) for d in doctors]


@router.get("/doctors/{doctor_id}", response_model=dict)
async def get_doctor(doctor_id: str, _: Doctor = Depends(admin_guard)):
    from beanie.odm.fields import PydanticObjectId
    doctor = await Doctor.get(PydanticObjectId(doctor_id))
    if not doctor:
        raise NotFoundError("Doctor not found")
    return _doc_dict(doctor)


@router.put("/doctors/{doctor_id}", response_model=dict)
async def update_doctor(
    doctor_id: str,
    body: UpdateDoctorRequest,
    _: Doctor = Depends(admin_guard),
):
    from beanie.odm.fields import PydanticObjectId
    doctor = await Doctor.get(PydanticObjectId(doctor_id))
    if not doctor:
        raise NotFoundError("Doctor not found")
    if body.name:
        doctor.name = body.name
    if body.phone:
        doctor.phone = body.phone
    if body.specialization:
        doctor.specialization = body.specialization
    doctor.updated_at = datetime.utcnow()
    await doctor.save()
    return _doc_dict(doctor)


@router.post("/doctors/{doctor_id}/status")
async def set_doctor_status(
    doctor_id: str,
    body: DoctorStatusRequest,
    _: Doctor = Depends(admin_guard),
):
    from beanie.odm.fields import PydanticObjectId
    doctor = await Doctor.get(PydanticObjectId(doctor_id))
    if not doctor:
        raise NotFoundError("Doctor not found")
    doctor.is_active = body.is_active
    doctor.updated_at = datetime.utcnow()
    await doctor.save()
    return {"id": str(doctor.id), "is_active": doctor.is_active}


@router.post("/doctors/{doctor_id}/reset-password")
async def reset_password(
    doctor_id: str,
    body: ResetPasswordRequest,
    _: Doctor = Depends(admin_guard),
):
    from beanie.odm.fields import PydanticObjectId
    doctor = await Doctor.get(PydanticObjectId(doctor_id))
    if not doctor:
        raise NotFoundError("Doctor not found")
    doctor.password_hash = hash_password(body.new_password)
    doctor.updated_at = datetime.utcnow()
    await doctor.save()
    return {"message": "Password reset successfully"}


@router.get("/doctors/{doctor_id}/metrics")
async def doctor_metrics(doctor_id: str, _: Doctor = Depends(admin_guard)):
    from beanie.odm.fields import PydanticObjectId
    did = PydanticObjectId(doctor_id)
    total_patients = await Patient.find(Patient.doctor_id == did).count()
    total_encounters = await Encounter.find(Encounter.doctor_id == did).count()
    encounter_ids = [e.id async for e in Encounter.find(Encounter.doctor_id == did)]
    reports = await Report.find({"encounter_id": {"$in": encounter_ids}}).count()
    last = await Encounter.find(Encounter.doctor_id == did).sort(-Encounter.created_at).first_or_none()
    return {
        "total_patients": total_patients,
        "total_encounters": total_encounters,
        "reports_generated": reports,
        "last_activity": last.created_at.isoformat() if last else None,
    }
