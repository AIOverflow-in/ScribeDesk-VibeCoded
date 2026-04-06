"use client";
import { useState } from "react";
import { getEhrSummary } from "@/lib/api/encounters";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileCode } from "lucide-react";
import { toast } from "sonner";

interface Props {
  encounterId: string;
}

export function EHRCopyHelper({ encounterId }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const result = await getEhrSummary(encounterId);
      setContent(result.content);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load EHR summary");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard — paste into your EHR");
    setTimeout(() => setCopied(false), 3000);
  };

  if (!content) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={handleLoad}
        disabled={loading}
      >
        <FileCode className="w-4 h-4" />
        {loading ? "Loading..." : "Format for EHR Copy"}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Structured for pasting into EMIS, SystmOne, Epic, etc.</p>
        <Button size="sm" variant={copied ? "default" : "outline"} className="gap-1.5 text-xs shrink-0" onClick={handleCopy}>
          {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy All</>}
        </Button>
      </div>
      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
        {content}
      </pre>
    </div>
  );
}
