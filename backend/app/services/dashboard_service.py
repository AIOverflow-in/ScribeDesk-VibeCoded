from beanie.odm.fields import PydanticObjectId
from app.models.encounter import Encounter
from app.models.patient import Patient
from app.models.report import Report
from app.models.task import Task


async def get_dashboard_metrics(doctor_id: PydanticObjectId) -> dict:
    total_patients = await Patient.find(Patient.doctor_id == doctor_id).count()
    total_encounters = await Encounter.find(Encounter.doctor_id == doctor_id).count()
    finished_encounters = await Encounter.find(
        Encounter.doctor_id == doctor_id,
        Encounter.status == "FINISHED",
    ).count()

    # Get encounter IDs for report count
    encounter_ids = [
        e.id async for e in Encounter.find(Encounter.doctor_id == doctor_id)
    ]
    reports_generated = await Report.find({"encounter_id": {"$in": encounter_ids}}).count()

    pending_tasks = await Task.find(
        Task.doctor_id == doctor_id,
        Task.status == "PENDING",
    ).count()
    completed_tasks = await Task.find(
        Task.doctor_id == doctor_id,
        Task.status == "COMPLETED",
    ).count()

    # Recent encounters (last 5)
    recent = await Encounter.find(
        Encounter.doctor_id == doctor_id,
    ).sort(-Encounter.created_at).limit(5).to_list()

    recent_list = []
    for enc in recent:
        patient = await Patient.get(enc.patient_id)
        recent_list.append({
            "id": str(enc.id),
            "patient_name": patient.name if patient else "Unknown",
            "status": enc.status,
            "created_at": enc.created_at.isoformat(),
        })

    return {
        "total_patients": total_patients,
        "total_encounters": total_encounters,
        "finished_encounters": finished_encounters,
        "reports_generated": reports_generated,
        "pending_tasks": pending_tasks,
        "completed_tasks": completed_tasks,
        "recent_encounters": recent_list,
    }
