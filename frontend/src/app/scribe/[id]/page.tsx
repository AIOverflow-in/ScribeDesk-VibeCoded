"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EncounterDetail, Template } from "@/lib/types";
import { getEncounterDetail, generatePrescription, regenerateSummary, attestEncounter, shareEncounter } from "@/lib/api/encounters";
import { listTemplates } from "@/lib/api/templates";
import { listLetters } from "@/lib/api/letters";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { useUIStore } from "@/lib/store/uiStore";
import { useAuthStore } from "@/lib/store/authStore";
import { ContextChat } from "@/components/scribe/ContextChat";
import { PrescriptionPad } from "@/components/scribe/PrescriptionPad";
import { BillingPanel } from "@/components/scribe/BillingPanel";
import { PatientSummaryPanel } from "@/components/scribe/PatientSummaryPanel";
import { LetterGenerator } from "@/components/scribe/LetterGenerator";
import { EvidencePanel } from "@/components/scribe/EvidencePanel";
import { EHRCopyHelper } from "@/components/scribe/EHRCopyHelper";
import { DrugInteractionWarnings } from "@/components/scribe/DrugInteractionWarnings";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { ArrowLeft, Loader2, Pill, MessageCircle, RefreshCw, ShieldCheck, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Letter } from "@/lib/types";

type TabId = "summary" | "billing" | "patient" | "letters" | "evidence" | "ehr";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "SOAP Notes" },
  { id: "billing", label: "Billing Codes" },
  { id: "patient", label: "Patient Summary" },
  { id: "letters", label: "Letters" },
  { id: "evidence", label: "Evidence" },
  { id: "ehr", label: "EHR Copy" },
];

export default function EncounterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<EncounterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingRx, setGeneratingRx] = useState(false);
  const [rxMeds, setRxMeds] = useState<EncounterDetail["prescriptions"]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [regenTemplateId, setRegenTemplateId] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [attesting, setAttesting] = useState(false);
  const [attested, setAttested] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const { setEncounter } = useEncounterStore();
  const { chatOpen, toggleChat } = useUIStore();
  const { user } = useAuthStore();

  useEffect(() => {
    getEncounterDetail(id)
      .then((d) => {
        setDetail(d);
        setRxMeds(d.prescriptions);
        setEncounter(d.encounter);
        setAttested(d.summary?.attested ?? false);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    listTemplates().then(setTemplates).catch(() => {});
    listLetters(id).then(setLetters).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error || !detail) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
          <p>Could not load session.</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/scribe")}>Back</Button>
        </div>
      </AppShell>
    );
  }

  const { encounter, summary, segments } = detail;

  const handleGenerateRx = async () => {
    setGeneratingRx(true);
    try {
      const meds = await generatePrescription(encounter.id);
      setRxMeds(meds);
      if (meds.length === 0) toast.info("No medications found in this encounter.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate prescription");
    } finally {
      setGeneratingRx(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const newSummary = await regenerateSummary(encounter.id, regenTemplateId || undefined);
      setDetail((d) => d ? { ...d, summary: newSummary } : d);
      toast.success("Clinical summary regenerated.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate summary");
    } finally {
      setRegenerating(false);
    }
  };

  const handleAttest = async () => {
    setAttesting(true);
    try {
      await attestEncounter(encounter.id);
      setAttested(true);
      setDetail((d) => d && d.summary ? { ...d, summary: { ...d.summary, attested: true, attested_at: new Date().toISOString() } } : d);
      toast.success("Note attested.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to attest");
    } finally {
      setAttesting(false);
    }
  };

  const handleShare = async () => {
    if (shareToken) {
      const url = `${window.location.origin}/shared/${shareToken}`;
      navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
      return;
    }
    setSharing(true);
    try {
      const result = await shareEncounter(encounter.id);
      setShareToken(result.share_token);
      const url = `${window.location.origin}/shared/${result.share_token}`;
      navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard.");
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to share");
    } finally {
      setSharing(false);
    }
  };

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  const vitalsItems = summary?.vitals
    ? Object.entries(summary.vitals).filter(([, v]) => v !== null && v !== undefined)
    : [];

  const vitalsLabels: Record<string, string> = {
    blood_pressure: "BP", heart_rate: "HR", temperature: "Temp",
    spo2: "SpO2", weight: "Weight", height: "Height", respiratory_rate: "RR",
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-white flex items-center gap-3 flex-wrap shrink-0">
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
          <div>
            <span className="font-semibold text-sm">{encounter.patient_name}</span>
            {(encounter.patient_age || encounter.patient_gender) && (
              <span className="text-xs text-gray-400 ml-2">
                {[encounter.patient_age && `${encounter.patient_age}y`, encounter.patient_gender].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {encounter.start_time && format(new Date(encounter.start_time), "MMM d, yyyy · h:mm a")}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
              encounter.status === "FINISHED" ? "border-black text-black" : "border-black bg-black text-white"
            }`}>
              {encounter.status}
            </span>
            {attested && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-green-300 text-green-700 bg-green-50">
                <ShieldCheck className="w-3 h-3" /> Attested
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={sharing}
              className="gap-1.5"
            >
              {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : copiedShare ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedShare ? "Copied!" : "Share"}
            </Button>
            <Button
              variant={chatOpen ? "default" : "outline"}
              size="sm"
              onClick={toggleChat}
              className={`gap-2 ${chatOpen ? "bg-black text-white" : ""}`}
            >
              <MessageCircle className="w-4 h-4" />
              AI Chat
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <PanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
          {/* Transcript */}
          <Panel defaultSize={45} minSize={25} className="flex flex-col p-6 overflow-y-auto border-r border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-widest">
              Transcript
            </h2>
            {segments.length === 0 ? (
              <p className="text-sm text-gray-400">No transcript recorded for this session.</p>
            ) : (
              <div>
                {segments.map((seg) => (
                  <div key={seg.id} className="flex gap-4 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-[11px] text-gray-400 font-mono shrink-0 mt-0.5 w-12 tabular-nums">
                      {formatTime(seg.start_time)}
                    </span>
                    <p className="text-sm text-gray-800 leading-relaxed flex-1">{seg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-gray-100 hover:bg-gray-300 transition-colors cursor-col-resize" />

          {/* Analysis — tabbed */}
          <Panel defaultSize={55} minSize={30} className="flex flex-col overflow-hidden">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-100 bg-white overflow-x-auto shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-black text-black"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* SOAP Notes */}
              {activeTab === "summary" && (
                <>
                  {!summary ? (
                    <p className="text-sm text-gray-400">No AI analysis available for this session.</p>
                  ) : (
                    <>
                      {/* Attestation */}
                      {!attested && (
                        <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-xs text-gray-600">Review and attest this AI-generated note before finalising</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs shrink-0"
                            onClick={handleAttest}
                            disabled={attesting}
                          >
                            {attesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                            Attest Note
                          </Button>
                        </div>
                      )}
                      {attested && summary.attested_at && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Attested by Dr. {user?.name} on {format(new Date(summary.attested_at), "MMM d, yyyy · h:mm a")}
                        </div>
                      )}

                      {/* Regenerate toolbar */}
                      <section className="flex items-center gap-2">
                        <select
                          className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
                          value={regenTemplateId}
                          onChange={(e) => setRegenTemplateId(e.target.value)}
                          disabled={regenerating}
                        >
                          <option value="">Default SOAP</option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs shrink-0"
                          onClick={handleRegenerate}
                          disabled={regenerating}
                        >
                          {regenerating
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating...</>
                            : <><RefreshCw className="w-3 h-3" /> Regenerate</>
                          }
                        </Button>
                      </section>

                      {/* Summary content */}
                      {regenerating ? (
                        <section className="space-y-3">
                          <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                          <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                          <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                          <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                          <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                        </section>
                      ) : (
                        <>
                          {summary.chief_complaint && (
                            <section>
                              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Chief Complaint</h3>
                              <p className="text-sm text-gray-800">{summary.chief_complaint}</p>
                            </section>
                          )}
                          {summary.history_of_present_illness && (
                            <section>
                              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">History</h3>
                              <p className="text-sm text-gray-800">{summary.history_of_present_illness}</p>
                            </section>
                          )}
                          {summary.physical_examination && (
                            <section>
                              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Examination</h3>
                              <p className="text-sm text-gray-800">{summary.physical_examination}</p>
                            </section>
                          )}
                          {summary.assessment && (
                            <section>
                              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Assessment</h3>
                              <p className="text-sm text-gray-800">{summary.assessment}</p>
                            </section>
                          )}
                          {summary.plan && (
                            <section>
                              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Plan</h3>
                              <p className="text-sm text-gray-800">{summary.plan}</p>
                            </section>
                          )}
                          {summary.diagnosis && summary.diagnosis.length > 0 && (
                            <section>
                              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Diagnoses</h3>
                              <div className="flex flex-wrap gap-1.5">
                                {summary.diagnosis.map((d, i) => (
                                  <span key={i} className="px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700">{d}</span>
                                ))}
                              </div>
                            </section>
                          )}
                          {vitalsItems.length > 0 && (
                            <section>
                              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Vitals</h3>
                              <div className="grid grid-cols-3 gap-2">
                                {vitalsItems.map(([key, val]) => (
                                  <div key={key} className="border border-gray-200 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-gray-400 uppercase">{vitalsLabels[key] || key}</p>
                                    <p className="text-sm font-semibold text-gray-900">{val as string}</p>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        </>
                      )}

                      {/* Prescription */}
                      <section>
                        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">Prescription</h3>
                        {rxMeds.length > 0 ? (
                          <div className="space-y-3">
                            <PrescriptionPad
                              medications={rxMeds}
                              doctorName={user?.name ?? ""}
                              doctorSpecialization={user?.specialization}
                              patientName={encounter.patient_name}
                              patientAge={encounter.patient_age}
                              patientGender={encounter.patient_gender}
                              date={encounter.start_time}
                              onRegenerate={handleGenerateRx}
                              regenerating={generatingRx}
                            />
                            <DrugInteractionWarnings
                              encounterId={encounter.id}
                              initialInteractions={summary.drug_interactions}
                              medicationCount={rxMeds.length}
                            />
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleGenerateRx} disabled={generatingRx || !summary}>
                            {generatingRx ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Pill className="w-4 h-4" /> Generate Prescription</>}
                          </Button>
                        )}
                      </section>
                    </>
                  )}
                </>
              )}

              {/* Billing Codes */}
              {activeTab === "billing" && (
                <BillingPanel
                  encounterId={encounter.id}
                  initialCodes={summary?.billing_codes}
                />
              )}

              {/* Patient-facing summary */}
              {activeTab === "patient" && (
                <PatientSummaryPanel
                  encounterId={encounter.id}
                  initialSummary={summary?.patient_summary}
                />
              )}

              {/* Letters */}
              {activeTab === "letters" && (
                <LetterGenerator
                  encounterId={encounter.id}
                  initialLetters={letters}
                />
              )}

              {/* Evidence */}
              {activeTab === "evidence" && (
                <EvidencePanel
                  encounterId={encounter.id}
                  initialEvidence={summary?.evidence}
                  diagnoses={summary?.diagnosis}
                />
              )}

              {/* EHR Copy */}
              {activeTab === "ehr" && (
                <EHRCopyHelper encounterId={encounter.id} />
              )}

            </div>
          </Panel>
        </PanelGroup>
      </div>

      <ContextChat />
    </AppShell>
  );
}
