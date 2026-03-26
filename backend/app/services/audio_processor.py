import asyncio
import logging
from datetime import datetime
from beanie.odm.fields import PydanticObjectId
from app.core.websocket_manager import ConnectionManager
from app.models.transcript_segment import TranscriptSegment
from app.models.encounter import Encounter
from app.services.deepgram_client import DeepgramConnection
from app.services.llm_service import chat_completion, parse_json_response
from app.services.prompts import partial_analysis_messages
from app.config import settings

logger = logging.getLogger(__name__)


class AudioProcessor:
    """
    Per-session audio processor. Proxies browser audio to Deepgram in real-time,
    handles transcript events, and runs 30s periodic LLM analysis.
    """

    def __init__(self, encounter_id: str, doctor_id: PydanticObjectId, ws_manager: ConnectionManager, specialization: str = "General Physician"):
        self.encounter_id = encounter_id
        self.doctor_id = doctor_id
        self.ws_manager = ws_manager
        self.specialization = specialization
        self.audio_queue: asyncio.Queue[bytes | None] = asyncio.Queue()
        self.accumulated_segments: list[str] = []
        self._deepgram: DeepgramConnection | None = None
        self._proxy_task: asyncio.Task | None = None
        self._analysis_task: asyncio.Task | None = None
        self._analysis_in_flight = False
        self._paused = False

    async def start(self):
        self._deepgram = DeepgramConnection(
            on_interim=self._on_interim,
            on_final=self._on_final,
        )
        await self._deepgram.connect()
        self._proxy_task = asyncio.create_task(self._proxy_audio())
        self._analysis_task = asyncio.create_task(self._periodic_analysis())
        logger.info(f"AudioProcessor started for encounter {self.encounter_id}")

    async def feed(self, audio_chunk: bytes):
        await self.audio_queue.put(audio_chunk)

    def pause(self):
        self._paused = True
        logger.info(f"AudioProcessor paused: {self.encounter_id}")

    def resume(self):
        self._paused = False
        logger.info(f"AudioProcessor resumed: {self.encounter_id}")

    async def reconnect_deepgram(self):
        """
        Close the current Deepgram connection and open a fresh one.
        Called when the browser WebSocket reconnects after a network drop.
        Preserves: accumulated_segments, encounter_id, _analysis_task.
        """
        # Close existing Deepgram connection
        if self._deepgram:
            try:
                await self._deepgram.close()
            except Exception:
                pass
            self._deepgram = None

        # Cancel and await the proxy task
        if self._proxy_task and not self._proxy_task.done():
            self._proxy_task.cancel()
            try:
                await asyncio.wait_for(self._proxy_task, timeout=2.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                pass

        # Drain stale pre-drop chunks from the queue
        drained = 0
        while not self.audio_queue.empty():
            try:
                self.audio_queue.get_nowait()
                drained += 1
            except asyncio.QueueEmpty:
                break
        if drained:
            logger.info(f"Drained {drained} stale chunks from queue for {self.encounter_id}")

        # Open a fresh Deepgram connection
        self._deepgram = DeepgramConnection(
            on_interim=self._on_interim,
            on_final=self._on_final,
        )
        await self._deepgram.connect()

        # Restart the proxy task
        self._proxy_task = asyncio.create_task(self._proxy_audio())
        logger.info(f"AudioProcessor reconnected Deepgram for encounter {self.encounter_id}")

    async def finish(self) -> str:
        """Stop processing and return accumulated transcript."""
        if self._analysis_task:
            self._analysis_task.cancel()
        # Signal proxy to stop
        await self.audio_queue.put(None)
        if self._proxy_task:
            try:
                await asyncio.wait_for(self._proxy_task, timeout=5.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                pass
        if self._deepgram:
            await self._deepgram.close()
        return " ".join(self.accumulated_segments)

    async def _proxy_audio(self):
        while True:
            chunk = await self.audio_queue.get()
            if chunk is None:
                break
            if not self._paused and self._deepgram:
                await self._deepgram.send_audio(chunk)

    async def _on_interim(self, transcript: str, speaker: int):
        await self.ws_manager.send_json(self.encounter_id, {
            "type": "TRANSCRIPT_INTERIM",
            "payload": {
                "text": transcript,
                "speaker": f"SPEAKER_{speaker}",
            }
        })

    async def _on_final(self, transcript: str, speaker: int, start_time: float, end_time: float):
        # Save segment to MongoDB
        segment = TranscriptSegment(
            encounter_id=PydanticObjectId(self.encounter_id),
            speaker=f"SPEAKER_{speaker}",
            text=transcript,
            start_time=start_time,
            end_time=end_time,
        )
        await segment.insert()

        # Append to encounter transcript (with speaker label for LLM context)
        encounter = await Encounter.get(PydanticObjectId(self.encounter_id))
        if encounter:
            encounter.transcript_text += f"\nSPEAKER_{speaker}: {transcript}"
            await encounter.save()

        self.accumulated_segments.append(transcript)

        # Broadcast to browser
        await self.ws_manager.send_json(self.encounter_id, {
            "type": "TRANSCRIPT_FINAL",
            "payload": {
                "id": str(segment.id),
                "text": transcript,
                "speaker": f"SPEAKER_{speaker}",
                "start_time": start_time,
                "end_time": end_time,
            }
        })

    async def _periodic_analysis(self):
        """Run LLM partial analysis every 30 seconds on accumulated transcript."""
        while True:
            await asyncio.sleep(30)
            if self._analysis_in_flight or not self.accumulated_segments:
                continue
            self._analysis_in_flight = True
            try:
                await self._run_partial_analysis()
            except Exception as e:
                logger.error(f"Partial analysis error: {e}")
            finally:
                self._analysis_in_flight = False

    async def run_immediate_analysis(self):
        """Trigger analysis immediately (called on pause)."""
        if self._analysis_in_flight or not self.accumulated_segments:
            return
        self._analysis_in_flight = True
        try:
            await self._run_partial_analysis()
        except Exception as e:
            logger.error(f"Immediate analysis error: {e}")
        finally:
            self._analysis_in_flight = False

    async def _run_partial_analysis(self):
        segments_snapshot = self.accumulated_segments[-50:]  # Last 50 utterances
        messages = partial_analysis_messages(segments_snapshot, self.specialization)
        try:
            text = await chat_completion(messages, model=settings.openai_model_fast, json_mode=True)
            result = await parse_json_response(text)
            await self.ws_manager.send_json(self.encounter_id, {
                "type": "PARTIAL_ANALYSIS",
                "payload": result,
            })
        except Exception as e:
            logger.error(f"LLM partial analysis failed: {e}")
