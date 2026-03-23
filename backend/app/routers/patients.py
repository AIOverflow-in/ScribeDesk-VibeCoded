from fastapi import APIRouter, Depends, Query
from app.schemas.patient import CreatePatientRequest, PatientResponse
from app.services import patient_service
from app.dependencies import get_current_user
from app.models.doctor import Doctor
from typing import List

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=List[dict])
async def search_patients(
    q: str = Query("", description="Search by name or phone"),
    current_user: Doctor = Depends(get_current_user),
):
    patients = await patient_service.search_patients(current_user.id, q)
    return [
        {
            "id": str(p.id),
            "doctor_id": str(p.doctor_id),
            "name": p.name,
            "phone": p.phone,
            "email": p.email,
            "age": p.age,
            "gender": p.gender,
            "created_at": p.created_at.isoformat(),
        }
        for p in patients
    ]


@router.post("", response_model=dict, status_code=201)
async def create_patient(
    body: CreatePatientRequest,
    current_user: Doctor = Depends(get_current_user),
):
    patient = await patient_service.create_patient(
        doctor_id=current_user.id,
        name=body.name,
        phone=body.phone,
        email=body.email,
        age=body.age,
        gender=body.gender,
    )
    return {
        "id": str(patient.id),
        "doctor_id": str(patient.doctor_id),
        "name": patient.name,
        "phone": patient.phone,
        "email": patient.email,
        "age": patient.age,
        "gender": patient.gender,
        "created_at": patient.created_at.isoformat(),
    }


@router.get("/{patient_id}", response_model=dict)
async def get_patient(
    patient_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    patient = await patient_service.get_patient(patient_id, current_user.id)
    return {
        "id": str(patient.id),
        "doctor_id": str(patient.doctor_id),
        "name": patient.name,
        "phone": patient.phone,
        "email": patient.email,
        "age": patient.age,
        "gender": patient.gender,
        "created_at": patient.created_at.isoformat(),
    }
