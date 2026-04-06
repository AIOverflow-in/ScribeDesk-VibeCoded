"""
Processor registry — owns the global map of active AudioProcessor instances.

Kept in a dedicated module so both websocket.py and main.py can import it
without creating circular dependencies.
"""
import asyncio
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.audio_processor import AudioProcessor

logger = logging.getLogger(__name__)

# encounter_id → AudioProcessor
_processors: dict[str, "AudioProcessor"] = {}

IDLE_TTL_SECONDS = 7200  # 2 hours


def get(encounter_id: str) -> "AudioProcessor | None":
    return _processors.get(encounter_id)


def set_processor(encounter_id: str, processor: "AudioProcessor") -> None:
    _processors[encounter_id] = processor


def remove(encounter_id: str) -> None:
    _processors.pop(encounter_id, None)


def contains(encounter_id: str) -> bool:
    return encounter_id in _processors


async def cleanup_idle_processors() -> None:
    """
    Finish and remove processors that have been idle for more than IDLE_TTL_SECONDS.
    Transitions the encounter to PAUSED in the DB so it remains resumable.
    Safe to call concurrently — works on a snapshot of keys.
    """
    from app.services.encounter_service import transition_encounter
    from beanie.odm.fields import PydanticObjectId
    from app.models.encounter import Encounter

    stale_ids = [
        eid for eid, proc in list(_processors.items())
        if proc.idle_seconds > IDLE_TTL_SECONDS
    ]

    for eid in stale_ids:
        proc = _processors.pop(eid, None)
        if proc is None:
            continue
        try:
            await proc.finish()
        except Exception as e:
            logger.error(f"[Registry] Error finishing idle processor {eid}: {e}")

        # Mark encounter as PAUSED so the doctor can see it in the sessions list
        try:
            enc = await Encounter.get(PydanticObjectId(eid))
            if enc and enc.status == "ACTIVE":
                from beanie.odm.fields import PydanticObjectId as ObjId
                await transition_encounter(eid, enc.doctor_id, "PAUSED")
        except Exception as e:
            logger.error(f"[Registry] Error pausing idle encounter {eid}: {e}")

        logger.info(f"[Registry] Cleaned up idle processor for encounter {eid}")
