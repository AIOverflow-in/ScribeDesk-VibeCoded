"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PatientSearch } from "@/components/scribe/PatientSearch";
import { RecordingControls } from "@/components/scribe/RecordingControls";
import { TranscriptPanel } from "@/components/scribe/TranscriptPanel";
import { ClinicalSummaryPanel } from "@/components/scribe/ClinicalSummary";
import { PrescriptionPanel } from "@/components/scribe/PrescriptionPanel";
import { ContextChat } from "@/components/scribe/ContextChat";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { useUIStore } from "@/lib/store/uiStore";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, ExternalLink } from "lucide-react";

export default function NewScribePage() {
  const router = useRouter();
  const { encounter, patient, reset, recordingStatus } = useEncounterStore();
  const { toggleChat, chatOpen } = useUIStore();

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Top header — patient + secondary actions */}
        <div className="px-4 py-3 border-b bg-white flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/scribe")}
            className="gap-1.5 text-gray-500 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            Sessions
          </Button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex-1 max-w-sm">
            <PatientSearch />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {encounter && (
              <Button
                variant={chatOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleChat}
                className={`gap-2 ${chatOpen ? "bg-black text-white" : ""}`}
              >
                <MessageCircle className="w-4 h-4" />
                AI Chat
              </Button>
            )}
            {recordingStatus === "done" && encounter && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => router.push(`/scribe/${encounter.id}`)}
              >
                <ExternalLink className="w-4 h-4" />
                View Summary
              </Button>
            )}
          </div>
        </div>

        {/* Hint when no patient selected */}
        {!patient && (
          <div className="flex items-center justify-center gap-2 py-2 bg-gray-50 border-b border-gray-100 text-gray-400 text-xs shrink-0">
            Search for a patient above to start recording
          </div>
        )}

        {/* Main two-column layout */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* LEFT: Transcript + recording controls at bottom */}
          <div className="flex-1 flex flex-col border-r border-gray-100 min-w-0">
            {/* Transcript header */}
            <div className="px-6 pt-5 pb-3 shrink-0">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Transcript</h2>
            </div>

            {/* Scrollable transcript */}
            <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
              <TranscriptPanel />
            </div>

            {/* Bottom recording bar */}
            <RecordingControls />
          </div>

          {/* RIGHT: AI analysis panel */}
          <div className="w-80 xl:w-96 flex flex-col overflow-y-auto p-6 bg-white gap-6 shrink-0">
            <section>
              <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">Clinical Summary</h2>
              <ClinicalSummaryPanel />
            </section>
            {recordingStatus === "done" && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">Prescription</h2>
                <PrescriptionPanel />
              </section>
            )}
          </div>
        </div>
      </div>

      <ContextChat />
    </AppShell>
  );
}
