"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PatientSearch } from "@/components/scribe/PatientSearch";
import { RecordingControls } from "@/components/scribe/RecordingControls";
import { TranscriptPanel } from "@/components/scribe/TranscriptPanel";
import { ClinicalSummaryPanel } from "@/components/scribe/ClinicalSummary";
import { PrescriptionPanel } from "@/components/scribe/PrescriptionPanel";
import { ContextChat } from "@/components/scribe/ContextChat";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { useUIStore } from "@/lib/store/uiStore";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { Template } from "@/lib/types";
import { listTemplates } from "@/lib/api/templates";
import { getEncounter } from "@/lib/api/encounters";
import { getPatient } from "@/lib/api/patients";

export default function NewScribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");
  const { encounter, patient, reset, setEncounter, setPatient, setRecordingStatus } = useEncounterStore();
  const { recordingStatus } = useEncounterStore();
  const { toggleChat, chatOpen } = useUIStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    listTemplates().then(setTemplates).catch(console.error);

    if (resumeId) {
      // Resuming an existing paused/active encounter — load it without resetting
      getEncounter(resumeId)
        .then(async (enc) => {
          setEncounter(enc);
          setRecordingStatus("paused");
          const p = await getPatient(enc.patient_id);
          setPatient(p);
        })
        .catch(() => {
          reset();
          router.replace("/scribe/new");
        });
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

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
          {recordingStatus === "idle" && !resumeId && (
            <select
              className="text-sm border rounded-md px-2.5 py-1.5 bg-white text-gray-700 disabled:opacity-40 shrink-0 max-w-[180px]"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={!patient}
              title="Select a note template"
            >
              <option value="">Default SOAP</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
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
        <PanelGroup orientation="horizontal" className="flex-1 overflow-hidden min-h-0">

          {/* LEFT: Transcript + recording controls at bottom */}
          <Panel defaultSize={60} minSize={30} className="flex flex-col border-r border-gray-100 min-w-0">
            <div className="px-6 pt-5 pb-3 shrink-0">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Transcript</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
              <TranscriptPanel />
            </div>
            <RecordingControls templateId={selectedTemplateId || undefined} />
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-gray-100 hover:bg-gray-300 transition-colors cursor-col-resize" />

          {/* RIGHT: AI analysis panel */}
          <Panel defaultSize={40} minSize={20} className="flex flex-col overflow-y-auto p-6 bg-white gap-6">
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
          </Panel>
        </PanelGroup>
      </div>

      <ContextChat />
    </AppShell>
  );
}
