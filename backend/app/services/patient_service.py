import re
from typing import List, Optional
from beanie.odm.fields import PydanticObjectId
from app.models.patient import Patient
from app.core.exceptions import NotFoundError


async def search_patients(doctor_id: PydanticObjectId, q: str = "", limit: int = 20) -> List[Patient]:
    if not q:
        return await Patient.find(Patient.doctor_id == doctor_id).limit(limit).to_list()

    pattern = re.compile(q, re.IGNORECASE)
    return await Patient.find(
        Patient.doctor_id == doctor_id,
        {"$or": [{"name": pattern}, {"phone": pattern}]},
    ).limit(limit).to_list()


async def get_patient(patient_id: str, doctor_id: PydanticObjectId) -> Patient:
    patient = await Patient.get(PydanticObjectId(patient_id))
    if not patient or patient.doctor_id != doctor_id:
        raise NotFoundError("Patient not found")
    return patient


async def create_patient(
    doctor_id: PydanticObjectId,
    name: str,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    age: Optional[int] = None,
    gender: Optional[str] = None,
) -> Patient:
    patient = Patient(
        doctor_id=doctor_id,
        name=name,
        phone=phone,
        email=email,
        age=age,
        gender=gender,
    )
    await patient.insert()
    return patient
