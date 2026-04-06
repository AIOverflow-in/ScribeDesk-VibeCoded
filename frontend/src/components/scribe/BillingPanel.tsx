"use client";
import { useState } from "react";
import { BillingCode } from "@/lib/types";
import { generateBillingCodes, toggleBillingCode } from "@/lib/api/encounters";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  encounterId: string;
  initialCodes?: BillingCode[];
}

const confidenceColor = {
  high: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-gray-50 text-gray-500 border-gray-200",
};

export function BillingPanel({ encounterId, initialCodes = [] }: Props) {
  const [codes, setCodes] = useState<BillingCode[]>(initialCodes);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateBillingCodes(encounterId);
      setCodes(result);
      if (result.length === 0) toast.info("No billing codes identified.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate billing codes");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async (code: string) => {
    try {
      await toggleBillingCode(encounterId, code);
      setCodes((prev) => prev.map((c) => c.code === code ? { ...c, accepted: !c.accepted } : c));
    } catch {
      toast.error("Failed to update code");
    }
  };

  if (codes.length === 0) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Receipt className="w-4 h-4" /> Generate Billing Codes</>}
      </Button>
    );
  }

  const icd = codes.filter((c) => c.type === "ICD-10");
  const cpt = codes.filter((c) => c.type === "CPT");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{codes.filter((c) => c.accepted).length} / {codes.length} accepted</span>
        <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Regenerate
        </Button>
      </div>

      {icd.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-2">ICD-10 Diagnoses</p>
          <div className="space-y-1.5">
            {icd.map((c) => (
              <CodeRow key={c.code} code={c} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}

      {cpt.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-2">CPT Procedures</p>
          <div className="space-y-1.5">
            {cpt.map((c) => (
              <CodeRow key={c.code} code={c} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CodeRow({ code, onToggle }: { code: BillingCode; onToggle: (c: string) => void }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-opacity ${code.accepted ? "" : "opacity-40"}`}
      onClick={() => onToggle(code.code)}
    >
      <button type="button" className="shrink-0">
        {code.accepted
          ? <CheckCircle className="w-4 h-4 text-green-600" />
          : <XCircle className="w-4 h-4 text-gray-300" />
        }
      </button>
      <span className="font-mono font-semibold text-gray-800 shrink-0">{code.code}</span>
      <span className="flex-1 text-gray-600 truncate">{code.description}</span>
      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium shrink-0 ${(confidenceColor as Record<string, string>)[code.confidence] || confidenceColor.low}`}>
        {code.confidence}
      </span>
    </div>
  );
}
