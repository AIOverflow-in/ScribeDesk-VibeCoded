"use client";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function ClinicalSummaryPanel() {
  const { summary, vitals, partialAnalysis, isProcessing } = useEncounterStore();

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
        {partialAnalysis.possible_diagnoses.length > 0 && (
          <div>
            <p className="font-medium text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Possible Diagnoses</p>
            <div className="flex flex-wrap gap-1.5">
              {partialAnalysis.possible_diagnoses.map((d, i) => (
                <span key={i} className="px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700">{d}</span>
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
