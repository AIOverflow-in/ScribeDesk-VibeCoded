"use client";
import { useState } from "react";
import { generateEvidence } from "@/lib/api/encounters";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Props {
  encounterId: string;
  initialEvidence?: string[];
  diagnoses?: string[];
}

export function EvidencePanel({ encounterId, initialEvidence = [], diagnoses = [] }: Props) {
  const [evidence, setEvidence] = useState<string[]>(initialEvidence);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateEvidence(encounterId);
      setEvidence(result);
      if (result.length === 0) toast.info("No specific guidelines found for these diagnoses.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch evidence");
    } finally {
      setLoading(false);
    }
  };

  if (evidence.length === 0) {
    if (!diagnoses || diagnoses.length === 0) return null;
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : <><BookOpen className="w-4 h-4" /> Evidence-Based Guidelines</>}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <BookOpen className="w-3.5 h-3.5" />
          Clinical Guidelines
        </div>
        <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
        </Button>
      </div>
      <div className="space-y-1.5">
        {evidence.map((item, i) => (
          <div key={i} className="flex gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-gray-700">
            <span className="text-blue-400 mt-0.5 shrink-0">↗</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
