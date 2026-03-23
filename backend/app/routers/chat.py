from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.schemas.chat import ChatRequest
from app.services.chat_service import stream_chat_response
from app.dependencies import get_current_user
from app.models.doctor import Doctor

router = APIRouter(prefix="/encounters", tags=["chat"])


@router.post("/{encounter_id}/chat")
async def chat(
    encounter_id: str,
    body: ChatRequest,
    current_user: Doctor = Depends(get_current_user),
):
    async def event_stream():
        async for token in stream_chat_response(encounter_id, current_user.id, body.message):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
