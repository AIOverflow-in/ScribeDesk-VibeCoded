"use client";
import { useState } from "react";
import { DrugInteraction } from "@/lib/types";
import { checkDrugInteractions } from "@/lib/api/encounters";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Props {
  encounterId: string;
  initialInteractions?: DrugInteraction[];
  medicationCount?: number;
}

const severityConfig = {
  Major: { bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700 border-red-300", icon: "text-red-500" },
  Moderate: { bg: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700 border-orange-300", icon: "text-orange-500" },
  Minor: { bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-600 border-yellow-200", icon: "text-yellow-500" },
};

export function DrugInteractionWarnings({ encounterId, initialInteractions = [], medicationCount = 0 }: Props) {
  const [interactions, setInteractions] = useState<DrugInteraction[]>(initialInteractions);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(initialInteractions.length > 0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const result = await checkDrugInteractions(encounterId);
      setInteractions(result);
      setChecked(true);
      if (result.length === 0) toast.success("No significant drug interactions found.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to check interactions");
    } finally {
      setLoading(false);
    }
  };

  if (medicationCount < 2 && interactions.length === 0) return null;

  if (!checked) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
        onClick={handleCheck}
        disabled={loading}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : <><ShieldAlert className="w-4 h-4" /> Check Drug Interactions</>}
      </Button>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
        <ShieldAlert className="w-4 h-4 text-green-500" />
        No significant drug interactions found.
      </div>
    );
  }

  const majorCount = interactions.filter((i) => i.severity === "Major").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <AlertTriangle className={`w-4 h-4 ${majorCount > 0 ? "text-red-500" : "text-orange-500"}`} />
        <span className={`font-medium ${majorCount > 0 ? "text-red-700" : "text-orange-700"}`}>
          {interactions.length} drug interaction{interactions.length > 1 ? "s" : ""} found
        </span>
        {majorCount > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded border border-red-200 text-[10px] font-semibold">{majorCount} MAJOR</span>}
      </div>

      {interactions.map((interaction, i) => {
        const cfg = severityConfig[interaction.severity] || severityConfig.Minor;
        const isExpanded = expandedIndex === i;
        return (
          <div key={i} className={`border rounded-lg overflow-hidden ${cfg.bg}`}>
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left"
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
            >
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${cfg.badge}`}>{interaction.severity}</span>
                <span className="font-medium text-gray-800">{interaction.drug_a} + {interaction.drug_b}</span>
              </div>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            {isExpanded && (
              <div className="px-3 pb-3 space-y-1.5 text-xs text-gray-700">
                <div><span className="font-medium text-gray-500">Mechanism: </span>{interaction.mechanism}</div>
                <div><span className="font-medium text-gray-500">Management: </span>{interaction.management}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
