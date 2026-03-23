from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from app.schemas.task import CreateTaskRequest, UpdateTaskRequest
from app.services import task_service
from app.dependencies import get_current_user
from app.models.doctor import Doctor

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _task_dict(t):
    return {
        "id": str(t.id),
        "doctor_id": str(t.doctor_id),
        "encounter_id": str(t.encounter_id) if t.encounter_id else None,
        "title": t.title,
        "description": t.description,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "status": t.status,
        "created_at": t.created_at.isoformat(),
    }


@router.get("", response_model=List[dict])
async def list_tasks(
    status: Optional[str] = Query(None),
    current_user: Doctor = Depends(get_current_user),
):
    tasks = await task_service.list_tasks(current_user.id, status)
    return [_task_dict(t) for t in tasks]


@router.post("", response_model=dict, status_code=201)
async def create_task(
    body: CreateTaskRequest,
    current_user: Doctor = Depends(get_current_user),
):
    task = await task_service.create_task(
        doctor_id=current_user.id,
        title=body.title,
        description=body.description,
        due_date=body.due_date,
        encounter_id=body.encounter_id,
    )
    return _task_dict(task)


@router.put("/{task_id}", response_model=dict)
async def update_task(
    task_id: str,
    body: UpdateTaskRequest,
    current_user: Doctor = Depends(get_current_user),
):
    task = await task_service.update_task(
        task_id, current_user.id,
        **body.model_dump(exclude_none=True),
    )
    return _task_dict(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    current_user: Doctor = Depends(get_current_user),
):
    await task_service.delete_task(task_id, current_user.id)
