"use client";
import { useState } from "react";
import { Letter } from "@/lib/types";
import { generateLetter, listLetters } from "@/lib/api/letters";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Props {
  encounterId: string;
  initialLetters?: Letter[];
}

const LETTER_TYPES: { value: Letter["letter_type"]; label: string; desc: string }[] = [
  { value: "referral", label: "Referral Letter", desc: "To a specialist, with clinical summary" },
  { value: "sick_note", label: "Sick Note / Fit Note", desc: "Medical certificate with rest period" },
  { value: "patient_instructions", label: "Patient Instructions", desc: "Medication & follow-up instructions" },
];

const typeLabel: Record<string, string> = {
  referral: "Referral Letter",
  sick_note: "Sick Note",
  patient_instructions: "Patient Instructions",
};

export function LetterGenerator({ encounterId, initialLetters = [] }: Props) {
  const [letters, setLetters] = useState<Letter[]>(initialLetters);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(letters.length === 0);

  const handleGenerate = async (letterType: Letter["letter_type"]) => {
    setGenerating(letterType);
    try {
      const letter = await generateLetter(encounterId, letterType);
      setLetters((prev) => [letter, ...prev]);
      setExpandedId(letter.id);
      setShowGenerator(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate letter");
    } finally {
      setGenerating(null);
    }
  };

  const handlePrint = (content: string) => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;line-height:1.7;font-size:14px}p{margin:0 0 12px}</style></head><body>${content}</body></html>`);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing letters */}
      {letters.map((l) => (
        <div key={l.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-700">{typeLabel[l.letter_type] || l.letter_type}</span>
              <span className="text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString()}</span>
            </div>
            {expandedId === l.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedId === l.id && (
            <div className="border-t border-gray-100 p-3 space-y-2">
              <div
                className="text-sm text-gray-700 leading-relaxed [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: l.content }}
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => handlePrint(l.content)}
              >
                <Printer className="w-3 h-3" /> Print
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Generator */}
      {showGenerator ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Choose letter type</p>
          {LETTER_TYPES.map((t) => (
            <button
              key={t.value}
              disabled={generating !== null}
              onClick={() => handleGenerate(t.value)}
              className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="text-left">
                <p className="font-medium text-gray-800">{t.label}</p>
                <p className="text-xs text-gray-400">{t.desc}</p>
              </div>
              {generating === t.value && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </button>
          ))}
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowGenerator(true)}
        >
          <Mail className="w-4 h-4" /> Generate Another Letter
        </Button>
      )}
    </div>
  );
}
