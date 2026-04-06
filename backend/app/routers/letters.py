from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal
from app.dependencies import get_current_user
from app.models.doctor import Doctor
from app.services import letters_service

router = APIRouter(prefix="/letters", tags=["letters"])


class GenerateLetterRequest(BaseModel):
    encounter_id: str
    letter_type: Literal["referral", "sick_note", "patient_instructions"]


@router.post("", response_model=dict, status_code=201)
async def generate_letter(
    body: GenerateLetterRequest,
    current_user: Doctor = Depends(get_current_user),
):
    letter = await letters_service.generate_letter(
        encounter_id=body.encounter_id,
        doctor_id=current_user.id,
        letter_type=body.letter_type,
    )
    return {
        "id": str(letter.id),
        "encounter_id": str(letter.encounter_id),
        "letter_type": letter.letter_type,
        "content": letter.content,
        "created_at": letter.created_at.isoformat(),
    }


@router.get("/{encounter_id}", response_model=list)
async def list_letters(
    encounter_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    letters = await letters_service.list_letters(encounter_id, current_user.id)
    return [
        {
            "id": str(l.id),
            "encounter_id": str(l.encounter_id),
            "letter_type": l.letter_type,
            "content": l.content,
            "created_at": l.created_at.isoformat(),
        }
        for l in letters
    ]
