import { WSMessage } from "../types";
import { getWSUrl } from "../api/client";
import { tryRefresh } from "../api/client";
import { AudioRecorder } from "./AudioRecorder";

type MessageHandler = (msg: WSMessage) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private encounterId: string;
  private onMessage: MessageHandler;
  private onAuthFailed?: () => void;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private shouldReconnect = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private offlineBuffer: ArrayBuffer[] = [];
  private isOnline = false;
  private recorder: AudioRecorder | null = null;
  private _authRetried = false;

  constructor(
    encounterId: string,
    onMessage: MessageHandler,
    recorder?: AudioRecorder,
    onAuthFailed?: () => void,
  ) {
    this.encounterId = encounterId;
    this.onMessage = onMessage;
    this.recorder = recorder ?? null;
    this.onAuthFailed = onAuthFailed;
  }

  connect() {
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect() {
    const url = getWSUrl(`/ws/session/${this.encounterId}`);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this._authRetried = false;
      this.isOnline = true;
      console.log("[WS] Connected:", this.encounterId);

      // Flush buffered audio from the drop window
      if (this.offlineBuffer.length > 0) {
        const header = this.recorder?.getHeaderChunk();
        if (header) {
          this.ws!.send(header);
        }
        for (const chunk of this.offlineBuffer) {
          this.ws!.send(chunk);
        }
        console.log(`[WS] Flushed ${this.offlineBuffer.length} buffered chunks`);
        this.offlineBuffer = [];
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.onMessage(msg);
      } catch (e) {
        console.warn("[WS] Failed to parse message:", event.data);
      }
    };

    this.ws.onclose = (e) => {
      this.isOnline = false;
      console.log("[WS] Closed:", e.code, e.reason);

      if (e.code === 4001) {
        // Auth failed — try a token refresh once before giving up
        if (!this._authRetried) {
          this._authRetried = true;
          tryRefresh().then((ok) => {
            if (ok && this.shouldReconnect) {
              console.log("[WS] Token refreshed after 4001, reconnecting...");
              this._scheduleReconnect();
            } else {
              console.warn("[WS] Token refresh failed or reconnect disabled — stopping");
              this.onAuthFailed?.();
            }
          });
        } else {
          // Already tried refresh once, truly unauthorized
          this.onAuthFailed?.();
        }
        return;
      }

      if (this.shouldReconnect && e.code !== 1000) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = (e) => {
      console.error("[WS] Error:", e);
    };
  }

  private _scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      console.log(`[WS] Reconnecting in ${this.reconnectDelay}ms...`);
      this._connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
    }, this.reconnectDelay);
  }

  sendAudio(buffer: ArrayBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(buffer);
    } else {
      this.offlineBuffer.push(buffer);
      this.recorder?.markDropped();
    }
  }

  hadBufferedDrops(): boolean {
    return this.recorder?.didHaveDrops() ?? false;
  }

  sendControl(type: string, payload: Record<string, unknown> = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close(1000, "session_complete");
    this.ws = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
