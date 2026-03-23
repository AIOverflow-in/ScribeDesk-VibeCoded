from fastapi import WebSocket
from typing import Dict
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, encounter_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[encounter_id] = websocket
        logger.info(f"WS connected: encounter={encounter_id}")

    def disconnect(self, encounter_id: str):
        self.active_connections.pop(encounter_id, None)
        logger.info(f"WS disconnected: encounter={encounter_id}")

    async def send_json(self, encounter_id: str, data: dict):
        ws = self.active_connections.get(encounter_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.warning(f"Failed to send WS message to {encounter_id}: {e}")
                self.disconnect(encounter_id)

    async def send_text(self, encounter_id: str, text: str):
        ws = self.active_connections.get(encounter_id)
        if ws:
            try:
                await ws.send_text(text)
            except Exception as e:
                logger.warning(f"Failed to send WS text to {encounter_id}: {e}")
                self.disconnect(encounter_id)

    def is_connected(self, encounter_id: str) -> bool:
        return encounter_id in self.active_connections


ws_manager = ConnectionManager()
