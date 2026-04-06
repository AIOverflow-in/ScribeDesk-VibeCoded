"use client";
import { useState } from "react";
import { generatePatientSummary } from "@/lib/api/encounters";
import { Button } from "@/components/ui/button";
import { Loader2, User, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  encounterId: string;
  initialSummary?: string;
}

export function PatientSummaryPanel({ encounterId, initialSummary }: Props) {
  const [summary, setSummary] = useState<string | undefined>(initialSummary);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generatePatientSummary(encounterId);
      setSummary(result.patient_summary);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate patient summary");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!summary) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          : <><User className="w-4 h-4" /> Generate Patient Summary</>
        }
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Plain-English — for printing or handing to patient</p>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1" onClick={handleCopy}>
            {copied ? <><Check className="w-3 h-3 text-green-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </Button>
          <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Regenerate"}
          </Button>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {summary}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 print:hidden"
        onClick={() => {
          const win = window.open("", "_blank");
          if (win) {
            win.document.write(`<html><body style="font-family:Georgia,serif;max-width:600px;margin:40px auto;line-height:1.6;font-size:15px"><h2 style="font-weight:normal;border-bottom:1px solid #ccc;padding-bottom:8px">After-Visit Summary</h2><p>${summary.replace(/\n/g, "<br>")}</p></body></html>`);
            win.document.close();
            win.print();
          }
        }}
      >
        Print Summary
      </Button>
    </div>
  );
}
