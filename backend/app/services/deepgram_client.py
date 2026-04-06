import asyncio
import json
import logging
import ssl
import certifi
from typing import Callable, Awaitable, Optional
import websockets
import httpx
from app.config import settings

# Use certifi's CA bundle so websockets can verify Deepgram's TLS cert on macOS/Linux
_ssl_context = ssl.create_default_context(cafile=certifi.where())

logger = logging.getLogger(__name__)

DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen"
DEEPGRAM_REST_URL = "https://api.deepgram.com/v1/listen"

DEEPGRAM_PRERECORDED_PARAMS = {
    "model": "nova-2-medical",
    "diarize": "true",
    "punctuate": "true",
    "language": "en",
    "smart_format": "true",
}


async def transcribe_prerecorded(audio_bytes: bytes) -> list[dict]:
    """
    Submit a full audio file to Deepgram's prerecorded REST API.
    Returns a list of utterance dicts: {speaker, transcript, start, end}.
    Used as the Layer 2 fallback when a session had network drops.
    """
    params = "&".join(f"{k}={v}" for k, v in DEEPGRAM_PRERECORDED_PARAMS.items())
    url = f"{DEEPGRAM_REST_URL}?{params}"
    headers = {
        "Authorization": f"Token {settings.deepgram_api_key}",
        "Content-Type": "audio/webm",
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(url, content=audio_bytes, headers=headers)
        response.raise_for_status()
        data = response.json()

    channels = data.get("results", {}).get("channels", [])
    if not channels:
        return []

    alternatives = channels[0].get("alternatives", [])
    if not alternatives:
        return []

    words = alternatives[0].get("words", [])
    if not words:
        return []

    # Group consecutive words by speaker into utterances
    results = []
    current_speaker = words[0].get("speaker", 0)
    current_words = [words[0]]

    for word in words[1:]:
        speaker = word.get("speaker", 0)
        if speaker != current_speaker:
            results.append({
                "speaker": current_speaker,
                "transcript": " ".join(w.get("punctuated_word", w.get("word", "")) for w in current_words),
                "start": current_words[0].get("start", 0.0),
                "end": current_words[-1].get("end", 0.0),
            })
            current_speaker = speaker
            current_words = [word]
        else:
            current_words.append(word)

    if current_words:
        results.append({
            "speaker": current_speaker,
            "transcript": " ".join(w.get("punctuated_word", w.get("word", "")) for w in current_words),
            "start": current_words[0].get("start", 0.0),
            "end": current_words[-1].get("end", 0.0),
        })

    return results
DEEPGRAM_PARAMS = {
    "model": "nova-2-medical",
    "diarize": "true",
    "punctuate": "true",
    "language": "en",
    "interim_results": "true",
    "endpointing": "300",
    "smart_format": "true",
    # No encoding/sample_rate: browser MediaRecorder outputs WebM container
    # which Deepgram auto-detects. Specifying encoding=webm-opus causes HTTP 400.
}


SUPPORTED_LANGUAGES = {
    "en": "en", "hi": "hi", "ar": "ar", "es": "es",
    "fr": "fr", "de": "de", "zh": "zh-CN",
}


class DeepgramConnection:
    """Manages a single WebSocket connection to Deepgram."""

    def __init__(
        self,
        on_interim: Callable[[str, int], Awaitable[None]],
        on_final: Callable[[str, int, float, float], Awaitable[None]],
        language: str = "en",
    ):
        self.on_interim = on_interim
        self.on_final = on_final
        self.language = SUPPORTED_LANGUAGES.get(language, "en")
        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self._receive_task: Optional[asyncio.Task] = None
        self._connected = False

    async def connect(self):
        params_dict = {**DEEPGRAM_PARAMS, "language": self.language}
        params = "&".join(f"{k}={v}" for k, v in params_dict.items())
        url = f"{DEEPGRAM_WS_URL}?{params}"
        headers = {"Authorization": f"Token {settings.deepgram_api_key}"}

        self._ws = await websockets.connect(url, extra_headers=headers, ping_interval=20, ssl=_ssl_context)
        self._connected = True
        self._receive_task = asyncio.create_task(self._receive_loop())
        logger.info("Deepgram connection established")

    async def send_audio(self, chunk: bytes):
        if self._ws and self._connected:
            try:
                await self._ws.send(chunk)
            except Exception as e:
                logger.warning(f"Deepgram send error: {e}")
                self._connected = False

    async def close(self):
        self._connected = False
        if self._receive_task:
            self._receive_task.cancel()
        if self._ws:
            try:
                # Send close stream signal
                await self._ws.send(json.dumps({"type": "CloseStream"}))
                await self._ws.close()
            except Exception:
                pass
        logger.info("Deepgram connection closed")

    async def _receive_loop(self):
        try:
            async for message in self._ws:
                await self._handle_message(message)
        except websockets.exceptions.ConnectionClosedOK:
            logger.info("Deepgram connection closed normally")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Deepgram receive error: {e}")
        finally:
            self._connected = False

    async def _handle_message(self, message: str):
        try:
            data = json.loads(message)
        except json.JSONDecodeError:
            return

        msg_type = data.get("type")
        if msg_type != "Results":
            return

        channel = data.get("channel", {})
        alternatives = channel.get("alternatives", [])
        if not alternatives:
            return

        alt = alternatives[0]
        transcript = alt.get("transcript", "").strip()
        if not transcript:
            return

        is_final = data.get("is_final", False)

        # Extract speaker from first word
        words = alt.get("words", [])
        speaker = words[0].get("speaker", 0) if words else 0

        # Extract timing from words
        start_time = words[0].get("start", 0.0) if words else 0.0
        end_time = words[-1].get("end", 0.0) if words else 0.0

        if is_final:
            await self.on_final(transcript, speaker, start_time, end_time)
        else:
            await self.on_interim(transcript, speaker)
