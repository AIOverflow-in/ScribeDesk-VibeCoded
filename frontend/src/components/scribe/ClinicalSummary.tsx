"use client";
import { useState, useEffect } from "react";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { regenerateSummary } from "@/lib/api/encounters";
import { listTemplates } from "@/lib/api/templates";
import { Template } from "@/lib/types";
import { toast } from "sonner";

export function ClinicalSummaryPanel() {
  const { summary, vitals, partialAnalysis, isProcessing, encounter, setSummary } = useEncounterStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (summary) {
      listTemplates().then(setTemplates).catch(() => {});
    }
  }, [!!summary]);

  const handleRegenerate = async () => {
    if (!encounter) return;
    setRegenerating(true);
    try {
      const newSummary = await regenerateSummary(encounter.id, selectedTemplateId || undefined);
      setSummary(newSummary);
      toast.success("Summary regenerated.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate summary");
    } finally {
      setRegenerating(false);
    }
  };

  if (isProcessing && !summary) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (summary) {
    return (
      <div className="space-y-4 text-sm">
        {/* Regenerate toolbar — always visible at top when summary exists */}
        <div className="flex items-center gap-2 pb-1">
          <select
            className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
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
        </div>

        <Separator />

        {/* Summary content — skeleton while regenerating */}
        {regenerating ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            {summary.chief_complaint && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-1">Chief Complaint</p>
                <p className="text-gray-800">{summary.chief_complaint}</p>
              </div>
            )}
            {summary.history_of_present_illness && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-1">History</p>
                <p className="text-gray-800">{summary.history_of_present_illness}</p>
              </div>
            )}
            {summary.physical_examination && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-1">Examination</p>
                <p className="text-gray-800">{summary.physical_examination}</p>
              </div>
            )}
            {summary.assessment && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-1">Assessment</p>
                <p className="text-gray-800">{summary.assessment}</p>
              </div>
            )}
            {summary.plan && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-1">Plan</p>
                <p className="text-gray-800">{summary.plan}</p>
              </div>
            )}
            {summary.diagnosis && summary.diagnosis.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-2">Diagnoses</p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.diagnosis.map((d, i) => (
                    <span key={i} className="px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {vitals && (
              <>
                <Separator />
                <VitalsGrid />
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (partialAnalysis) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium">Live Analysis</p>

        {partialAnalysis.key_points.length > 0 && (
          <div>
            <p className="font-medium text-xs text-gray-500 mb-1 uppercase tracking-wide">Key Points</p>
            <ul className="space-y-1">
              {partialAnalysis.key_points.map((p, i) => (
                <li key={i} className="text-gray-700 flex gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(partialAnalysis.differential_diagnoses && partialAnalysis.differential_diagnoses.length > 0) ? (
          <div>
            <p className="font-medium text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Differential Diagnoses</p>
            <div className="space-y-1.5">
              {partialAnalysis.differential_diagnoses.map((d, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-semibold shrink-0">{i + 1}</span>
                  <div>
                    <span className="font-medium text-gray-800">{d.diagnosis}</span>
                    {d.rationale && <p className="text-gray-500 mt-0.5">{d.rationale}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : partialAnalysis.possible_diagnoses.length > 0 && (
          <div>
            <p className="font-medium text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Possible Diagnoses</p>
            <div className="flex flex-wrap gap-1.5">
              {partialAnalysis.possible_diagnoses.map((d, i) => (
                <span key={i} className="px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700">{d}</span>
              ))}
            </div>
          </div>
        )}

        {partialAnalysis.red_flags && partialAnalysis.red_flags.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
            <p className="font-medium text-xs text-red-600 mb-1 uppercase tracking-wide">Red Flags</p>
            <ul className="space-y-0.5">
              {partialAnalysis.red_flags.map((f, i) => (
                <li key={i} className="text-red-700 text-xs flex gap-1.5">
                  <span className="text-red-400 shrink-0">!</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {partialAnalysis.suggested_workup && partialAnalysis.suggested_workup.length > 0 && (
          <div>
            <p className="font-medium text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Suggested Workup</p>
            <div className="flex flex-wrap gap-1.5">
              {partialAnalysis.suggested_workup.map((w, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">{w}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-400">
      AI analysis will appear here every 30 seconds during recording.
    </p>
  );
}

function VitalsGrid() {
  const { vitals } = useEncounterStore();
  if (!vitals) return null;

  const items = [
    { label: "BP", value: vitals.blood_pressure },
    { label: "HR", value: vitals.heart_rate },
    { label: "Temp", value: vitals.temperature },
    { label: "SpO2", value: vitals.spo2 },
    { label: "Weight", value: vitals.weight },
    { label: "Height", value: vitals.height },
  ].filter((i) => i.value);

  if (!items.length) return null;

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-2">Vitals</p>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ label, value }) => (
          <div key={label} className="border border-gray-200 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-400 uppercase">{label}</p>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
