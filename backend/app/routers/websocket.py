import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token
from app.core.websocket_manager import ws_manager
from app.services.audio_processor import AudioProcessor
from app.services.full_analysis import run_full_analysis
from app.services import processor_registry
from app.models.doctor import Doctor
from beanie.odm.fields import PydanticObjectId

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/session/{encounter_id}")
async def websocket_session(
    websocket: WebSocket,
    encounter_id: str,
    token: str = Query(...),
):
    # Authenticate via token query param (WS can't set Authorization header)
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Unauthorized")
        return

    doctor_id_str = payload.get("sub")
    doctor = await Doctor.get(PydanticObjectId(doctor_id_str))
    if not doctor or not doctor.is_active:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await ws_manager.connect(encounter_id, websocket)

    # Reconnect path: reuse existing processor, open a new Deepgram connection
    if processor_registry.contains(encounter_id):
        processor = processor_registry.get(encounter_id)
        await processor.reconnect_deepgram()
        is_reconnect = True
        logger.info(f"[WS] Reconnected to existing processor for {encounter_id}")
    else:
        from app.models.encounter import Encounter as EncounterModel
        from app.models.transcript_segment import TranscriptSegment
        enc = await EncounterModel.get(PydanticObjectId(encounter_id))
        lang = enc.language if enc and enc.language else "en"
        processor = AudioProcessor(
            encounter_id=encounter_id,
            doctor_id=doctor.id,
            ws_manager=ws_manager,
            specialization=doctor.specialization or "General Physician",
            language=lang,
        )
        processor_registry.set_processor(encounter_id, processor)

        # Pre-populate accumulated_segments from DB (handles backend restarts)
        existing_segs = await TranscriptSegment.find(
            TranscriptSegment.encounter_id == PydanticObjectId(encounter_id)
        ).sort("+start_time").to_list()
        if existing_segs:
            processor.accumulated_segments = [s.text for s in existing_segs]
            logger.info(f"[WS] Pre-populated {len(existing_segs)} segments for {encounter_id}")

        await processor.start()

        # If encounter was previously paused (e.g. after backend restart), keep processor paused
        if enc and enc.status == "PAUSED":
            processor.pause()

        is_reconnect = False

    await ws_manager.send_json(encounter_id, {
        "type": "CONNECTED",
        "payload": {
            "encounter_id": encounter_id,
            "message": "Recording session started",
            "is_reconnect": is_reconnect,
        }
    })

    session_finished = False

    try:
        while True:
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break

            # Binary = audio chunk
            if "bytes" in message and message["bytes"]:
                await processor.feed(message["bytes"])

            # Text = control message
            elif "text" in message and message["text"]:
                try:
                    control = json.loads(message["text"])
                    msg_type = control.get("type", "")

                    if msg_type == "PAUSE":
                        processor.pause()
                        asyncio.create_task(processor.run_immediate_analysis())
                        await ws_manager.send_json(encounter_id, {
                            "type": "PAUSED",
                            "payload": {"message": "Recording paused"}
                        })

                    elif msg_type == "RESUME":
                        processor.resume()
                        await ws_manager.send_json(encounter_id, {
                            "type": "RESUMED",
                            "payload": {"message": "Recording resumed"}
                        })

                    elif msg_type == "FINISH":
                        session_finished = True
                        await ws_manager.send_json(encounter_id, {
                            "type": "FINISHING",
                            "payload": {"message": "Processing final analysis..."}
                        })
                        await processor.finish()
                        asyncio.create_task(
                            run_full_analysis(encounter_id, doctor.id, doctor.specialization or "General Physician")
                        )

                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON control message from {encounter_id}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {encounter_id} (finished={session_finished})")
    except Exception as e:
        logger.error(f"WebSocket error for {encounter_id}: {e}")
    finally:
        ws_manager.disconnect(encounter_id)

        if session_finished:
            # Clean up processor only on intentional FINISH
            processor_registry.remove(encounter_id)
            logger.info(f"Processor cleaned up for finished session {encounter_id}")
        else:
            # Unexpected disconnect (reload, navigation, network drop, tab close)
            # Auto-pause to keep encounter in a clean, resumable state
            processor.pause()
            try:
                from app.models.encounter import Encounter as EncounterModel
                from app.services.encounter_service import transition_encounter
                enc = await EncounterModel.get(PydanticObjectId(encounter_id))
                if enc and enc.status == "ACTIVE":
                    await transition_encounter(encounter_id, doctor.id, "PAUSED")
                    logger.info(f"[WS] Auto-paused encounter {encounter_id} on disconnect")
            except Exception as e:
                logger.error(f"[WS] Failed to auto-pause encounter {encounter_id}: {e}")
            # Processor stays in registry for reconnection
