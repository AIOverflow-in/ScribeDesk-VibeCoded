from datetime import datetime
from beanie.odm.fields import PydanticObjectId
from app.models.encounter import Encounter
from app.core.exceptions import NotFoundError, ConflictError

VALID_TRANSITIONS = {
    "CREATED": ["ACTIVE"],
    "ACTIVE": ["PAUSED", "FINISHED"],
    "PAUSED": ["ACTIVE", "FINISHED"],
    "FINISHED": [],
}


async def list_encounters(doctor_id: PydanticObjectId) -> list[Encounter]:
    return await Encounter.find(
        Encounter.doctor_id == doctor_id
    ).sort(-Encounter.created_at).to_list()


async def get_encounter(encounter_id: str, doctor_id: PydanticObjectId) -> Encounter:
    encounter = await Encounter.get(PydanticObjectId(encounter_id))
    if not encounter or encounter.doctor_id != doctor_id:
        raise NotFoundError("Encounter not found")
    return encounter


async def start_encounter(doctor_id: PydanticObjectId, patient_id: str, template_id: str | None = None, language: str = "en") -> Encounter:
    encounter = Encounter(
        doctor_id=doctor_id,
        patient_id=PydanticObjectId(patient_id),
        status="ACTIVE",
        start_time=datetime.utcnow(),
        template_id=PydanticObjectId(template_id) if template_id else None,
        language=language,
    )
    await encounter.insert()
    return encounter


async def transition_encounter(encounter_id: str, doctor_id: PydanticObjectId, new_status: str) -> Encounter:
    encounter = await get_encounter(encounter_id, doctor_id)
    allowed = VALID_TRANSITIONS.get(encounter.status, [])
    if new_status not in allowed:
        raise ConflictError(f"Cannot transition from {encounter.status} to {new_status}")

    encounter.status = new_status
    if new_status == "FINISHED":
        encounter.end_time = datetime.utcnow()
    await encounter.save()
    return encounter


async def append_transcript(encounter_id: PydanticObjectId, text: str):
    encounter = await Encounter.get(encounter_id)
    if encounter:
        encounter.transcript_text += " " + text
        await encounter.save()
