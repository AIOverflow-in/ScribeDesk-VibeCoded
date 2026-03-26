from fastapi import APIRouter, Depends, Query
from app.schemas.patient import CreatePatientRequest
from app.services import patient_service
from app.dependencies import get_current_user
from app.models.doctor import Doctor
from app.models.encounter import Encounter
from app.models.clinical_summary import ClinicalSummary
from app.models.prescription import Prescription
from app.models.template import Template
from beanie.odm.fields import PydanticObjectId
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


@router.get("/{patient_id}/encounters", response_model=list)
async def get_patient_encounters(
    patient_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    """Return all encounters for a patient with their clinical summary and prescription."""
    # Ownership check
    await patient_service.get_patient(patient_id, current_user.id)

    encounters = await Encounter.find(
        Encounter.patient_id == PydanticObjectId(patient_id),
        Encounter.doctor_id == current_user.id,
    ).sort(-Encounter.created_at).to_list()

    result = []
    for enc in encounters:
        enc_id = enc.id

        summary = await ClinicalSummary.find_one(ClinicalSummary.encounter_id == enc_id)
        prescription = await Prescription.find_one(Prescription.encounter_id == enc_id)

        template_name = None
        if enc.template_id:
            tmpl = await Template.get(enc.template_id)
            if tmpl:
                template_name = tmpl.name

        summary_data = None
        if summary:
            summary_data = {
                "chief_complaint": summary.chief_complaint,
                "assessment": summary.assessment,
                "plan": summary.plan,
                "diagnosis": summary.diagnosis,
            }

        medications = []
        if prescription:
            medications = [
                {"name": m.name, "dosage": m.dosage, "frequency": m.frequency}
                for m in prescription.medications
            ]

        result.append({
            "id": str(enc.id),
            "status": enc.status,
            "start_time": enc.start_time.isoformat() if enc.start_time else None,
            "end_time": enc.end_time.isoformat() if enc.end_time else None,
            "template_name": template_name,
            "summary": summary_data,
            "medications": medications,
            "created_at": enc.created_at.isoformat(),
        })

    return result


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
