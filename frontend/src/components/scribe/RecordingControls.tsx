"use client";
import { useRef, useEffect, useState } from "react";
import { Mic, Square, Pause, Loader2 } from "lucide-react";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { AudioRecorder } from "@/lib/websocket/AudioRecorder";
import { WSClient } from "@/lib/websocket/WSClient";
import { WSMessage, FinalAnalysis, PartialAnalysis } from "@/lib/types";
import * as encounterApi from "@/lib/api/encounters";
import { toast } from "sonner";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RecordingControls() {
  const {
    patient, encounter, setEncounter, setConnected,
    addSegment, setInterim, setPartialAnalysis, applyFinalAnalysis, setProcessing,
    recordingStatus: status, setRecordingStatus: setStatus,
  } = useEncounterStore();

  const recorderRef = useRef<AudioRecorder | null>(null);
  const wsRef = useRef<WSClient | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "recording") return;
    if (startTimeRef.current === null) startTimeRef.current = Date.now() - elapsed * 1000;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startTimeRef.current!)) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  const handleMessage = (msg: WSMessage) => {
    switch (msg.type) {
      case "CONNECTED":
        setConnected(true);
        break;
      case "TRANSCRIPT_INTERIM":
        setInterim((msg.payload as { text: string }).text);
        break;
      case "TRANSCRIPT_FINAL":
        addSegment({
          id: (msg.payload as { id: string }).id || Date.now().toString(),
          encounter_id: encounter?.id || "",
          speaker: (msg.payload as { speaker: string }).speaker || "SPEAKER_0",
          text: (msg.payload as { text: string }).text || "",
          start_time: (msg.payload as { start_time: number }).start_time || 0,
          end_time: (msg.payload as { end_time: number }).end_time || 0,
        });
        break;
      case "PARTIAL_ANALYSIS":
        setPartialAnalysis(msg.payload as unknown as PartialAnalysis);
        break;
      case "PROCESSING_STARTED":
        setProcessing(true);
        break;
      case "FINAL_ANALYSIS":
        applyFinalAnalysis(msg.payload as unknown as FinalAnalysis);
        setStatus("done");
        toast.success("Analysis complete");
        wsRef.current?.disconnect();
        break;
      case "ERROR":
        toast.error((msg.payload as { message: string }).message || "An error occurred");
        break;
    }
  };

  const startRecording = async () => {
    if (!patient) return;
    try {
      const enc = await encounterApi.startEncounter(patient.id);
      setEncounter(enc);
      startTimeRef.current = Date.now();
      setElapsed(0);
      const recorder = new AudioRecorder((chunk) => wsRef.current?.sendAudio(chunk));
      recorderRef.current = recorder;
      const ws = new WSClient(enc.id, handleMessage, recorder);
      wsRef.current = ws;
      ws.connect();
      await recorder.start();
      setStatus("recording");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to start recording");
    }
  };

  const pauseRecording = async () => {
    if (!encounter) return;
    recorderRef.current?.pause();
    wsRef.current?.sendControl("PAUSE");
    await encounterApi.pauseEncounter(encounter.id);
    setStatus("paused");
  };

  const resumeRecording = async () => {
    if (!encounter) return;
    recorderRef.current?.resume();
    wsRef.current?.sendControl("RESUME");
    await encounterApi.resumeEncounter(encounter.id);
    setStatus("recording");
  };

  const finishRecording = async () => {
    if (!encounter) return;
    setStatus("finishing");
    try {
      wsRef.current?.sendControl("FINISH");
      recorderRef.current?.stop();
      await encounterApi.finishEncounter(encounter.id);
      setConnected(false);

      // Layer 2: upload full session blob if any drops occurred
      if (wsRef.current?.hadBufferedDrops()) {
        const blob = recorderRef.current?.getSessionBlob();
        if (blob) {
          encounterApi.uploadSessionAudio(encounter.id, blob).catch((err) => {
            console.warn("[Layer2] Session audio upload failed:", err);
          });
          toast.info("Gap audio uploading in background");
        }
      }

      setTimeout(() => wsRef.current?.disconnect(), 180000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to finish session");
      setStatus("recording");
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white shrink-0">
      {/* Left: elapsed timer */}
      <span className="text-sm font-mono text-gray-400 w-16 tabular-nums">
        {formatElapsed(elapsed)}
      </span>

      {/* Center: main controls */}
      <div className="flex items-center gap-4">
        {/* IDLE */}
        {status === "idle" && (
          <button
            onClick={startRecording}
            disabled={!patient}
            title="Start recording"
            className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}

        {/* RECORDING — big button = pause, small button = finish */}
        {status === "recording" && (
          <>
            <button
              onClick={pauseRecording}
              title="Pause recording"
              className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow hover:bg-gray-800 transition-colors"
            >
              <Pause className="w-6 h-6" />
            </button>
            <button
              onClick={finishRecording}
              title="Finish & analyze"
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}

        {/* PAUSED — big button = resume, small button = finish */}
        {status === "paused" && (
          <>
            <button
              onClick={resumeRecording}
              title="Resume recording"
              className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow hover:bg-gray-800 transition-colors"
            >
              <Mic className="w-6 h-6" />
            </button>
            <button
              onClick={finishRecording}
              title="Finish & analyze"
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}

        {/* FINISHING */}
        {status === "finishing" && (
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}

        {/* DONE */}
        {status === "done" && (
          <div className="w-14 h-14 rounded-full border-2 border-black flex items-center justify-center">
            <span className="text-black font-bold text-xl">✓</span>
          </div>
        )}
      </div>

      {/* Right: status label */}
      <span className="text-xs w-16 text-right">
        {status === "idle" && <span className="text-gray-300">Ready</span>}
        {status === "recording" && <span className="text-black font-medium">Recording</span>}
        {status === "paused" && <span className="text-gray-400">Paused</span>}
        {status === "finishing" && <span className="text-gray-400">Analyzing...</span>}
        {status === "done" && <span className="text-gray-600 font-medium">Done</span>}
      </span>
    </div>
  );
}
