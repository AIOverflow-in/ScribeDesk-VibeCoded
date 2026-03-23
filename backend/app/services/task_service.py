from datetime import datetime
from typing import List, Optional
from beanie.odm.fields import PydanticObjectId
from app.models.task import Task
from app.core.exceptions import NotFoundError


async def list_tasks(doctor_id: PydanticObjectId, status: Optional[str] = None) -> List[Task]:
    query = Task.find(Task.doctor_id == doctor_id)
    if status:
        query = query.find(Task.status == status)
    return await query.sort(-Task.created_at).to_list()


async def get_task(task_id: str, doctor_id: PydanticObjectId) -> Task:
    task = await Task.get(PydanticObjectId(task_id))
    if not task or task.doctor_id != doctor_id:
        raise NotFoundError("Task not found")
    return task


async def create_task(
    doctor_id: PydanticObjectId,
    title: str,
    description: Optional[str] = None,
    due_date: Optional[datetime] = None,
    encounter_id: Optional[str] = None,
) -> Task:
    task = Task(
        doctor_id=doctor_id,
        title=title,
        description=description,
        due_date=due_date,
        encounter_id=PydanticObjectId(encounter_id) if encounter_id else None,
    )
    await task.insert()
    return task


async def update_task(task_id: str, doctor_id: PydanticObjectId, **kwargs) -> Task:
    task = await get_task(task_id, doctor_id)
    for k, v in kwargs.items():
        if v is not None:
            setattr(task, k, v)
    task.updated_at = datetime.utcnow()
    await task.save()
    return task


async def delete_task(task_id: str, doctor_id: PydanticObjectId):
    task = await get_task(task_id, doctor_id)
    await task.delete()
