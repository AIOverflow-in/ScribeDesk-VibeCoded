"use client";
import { useEffect, useRef } from "react";
import { useEncounterStore } from "@/lib/store/encounterStore";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function StatusLine({ status }: { status: string }) {
  if (status === "recording") {
    return (
      <div className="flex items-center gap-2 py-3 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse shrink-0" />
        <span className="flex-1 border-t border-dashed border-gray-200" />
        <span className="text-[11px] text-gray-400 shrink-0">Recording</span>
      </div>
    );
  }
  if (status === "paused") {
    return (
      <div className="flex items-center gap-2 py-3 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
        <span className="flex-1 border-t border-dashed border-gray-200" />
        <span className="text-[11px] text-gray-400 shrink-0">Paused</span>
      </div>
    );
  }
  return null;
}

export function TranscriptPanel() {
  const { segments, interimText, recordingStatus } = useEncounterStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments.length, interimText]);

  const isActive = recordingStatus === "recording" || recordingStatus === "paused";

  if (segments.length === 0 && !interimText && !isActive) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-12">
        Transcript will appear here as you speak...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pr-1">
      {segments.map((seg) => (
        <div key={seg.id} className="flex gap-4 py-2.5 border-b border-gray-50 last:border-0">
          <span className="text-[11px] text-gray-400 font-mono shrink-0 mt-0.5 w-12 tabular-nums">
            {formatTime(seg.start_time)}
          </span>
          <p className="text-sm text-gray-800 leading-relaxed flex-1">{seg.text}</p>
        </div>
      ))}

      {/* Interim text */}
      {interimText && (
        <div className="flex gap-4 py-2.5">
          <span className="text-[11px] text-gray-300 font-mono shrink-0 mt-0.5 w-12">—</span>
          <p className="text-sm text-gray-400 italic flex-1">{interimText}</p>
        </div>
      )}

      {/* Inline recording/paused status indicator */}
      {isActive && <StatusLine status={recordingStatus} />}

      <div ref={bottomRef} />
    </div>
  );
}
