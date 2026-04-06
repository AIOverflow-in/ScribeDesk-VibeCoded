"use client";
import { useEffect, useState } from "react";
import { PreVisitBriefData } from "@/lib/types";
import { getPreVisitBrief } from "@/lib/api/encounters";
import { ChevronDown, ChevronUp, History } from "lucide-react";

interface Props {
  patientId: string;
}

export function PreVisitBrief({ patientId }: Props) {
  const [brief, setBrief] = useState<PreVisitBriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    getPreVisitBrief(patientId)
      .then((data) => {
        if (data.has_history) setBrief(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-400 animate-pulse">
        Loading patient history...
      </div>
    );
  }

  if (!brief || !brief.has_history) return null;

  return (
    <div className="border-b border-amber-100 bg-amber-50">
      <button
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-amber-700 font-medium hover:bg-amber-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <History className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">Pre-visit brief available — prior history found</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-1 grid grid-cols-2 gap-3 text-xs">
          {brief.last_visit_summary && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mb-1">Last Visit</p>
              <p className="text-gray-700">{brief.last_visit_summary}</p>
            </div>
          )}
          {brief.active_diagnoses.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mb-1">Active Diagnoses</p>
              <ul className="space-y-0.5">
                {brief.active_diagnoses.map((d, i) => (
                  <li key={i} className="text-gray-700 flex gap-1"><span className="text-amber-400">•</span>{d}</li>
                ))}
              </ul>
            </div>
          )}
          {brief.current_medications.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mb-1">Current Medications</p>
              <ul className="space-y-0.5">
                {brief.current_medications.map((m, i) => (
                  <li key={i} className="text-gray-700 flex gap-1"><span className="text-amber-400">•</span>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {brief.pending_follow_ups.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mb-1">Pending Follow-ups</p>
              <ul className="space-y-0.5">
                {brief.pending_follow_ups.map((f, i) => (
                  <li key={i} className="text-gray-700 flex gap-1"><span className="text-amber-400">•</span>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {brief.notable_flags.length > 0 && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-red-500 font-semibold mb-1">Notable Flags</p>
              <div className="flex flex-wrap gap-1.5">
                {brief.notable_flags.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-50 border border-red-200 rounded text-red-600">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
