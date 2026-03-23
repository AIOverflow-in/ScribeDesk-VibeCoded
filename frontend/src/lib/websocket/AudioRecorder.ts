export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private onChunk: (chunk: ArrayBuffer) => void;
  private headerChunk: ArrayBuffer | null = null;
  private isFirstChunk = true;
  private sessionBlobs: Blob[] = [];
  private hadDrops = false;

  constructor(onChunk: (chunk: ArrayBuffer) => void) {
    this.onChunk = onChunk;
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 48000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Use webm/opus which Deepgram accepts directly
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      audioBitsPerSecond: 16000,
    });

    this.mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        this.sessionBlobs.push(e.data);
        const buffer = await e.data.arrayBuffer();
        if (this.isFirstChunk) {
          this.headerChunk = buffer;
          this.isFirstChunk = false;
        }
        this.onChunk(buffer);
      }
    };

    // Emit chunks every 250ms for low-latency streaming
    this.mediaRecorder.start(250);
  }

  pause() {
    this.mediaRecorder?.pause();
  }

  resume() {
    this.mediaRecorder?.resume();
  }

  stop() {
    this.mediaRecorder?.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.mediaRecorder = null;
    this.stream = null;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  getHeaderChunk(): ArrayBuffer | null {
    return this.headerChunk;
  }

  getSessionBlob(): Blob {
    return new Blob(this.sessionBlobs, { type: "audio/webm" });
  }

  markDropped(): void {
    this.hadDrops = true;
  }

  didHaveDrops(): boolean {
    return this.hadDrops;
  }
}
