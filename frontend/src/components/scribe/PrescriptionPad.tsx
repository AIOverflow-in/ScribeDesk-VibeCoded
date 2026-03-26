"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Medication } from "@/lib/types";
import { format } from "date-fns";

interface PrescriptionPadProps {
  medications: Medication[];
  doctorName: string;
  doctorSpecialization?: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  date?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

/** Strip LLM artifacts: treat empty / "null" / "None" as absent. */
const v = (s: string | undefined) =>
  s && s !== "null" && s !== "None" ? s : "";

export function PrescriptionPad({
  medications,
  doctorName,
  doctorSpecialization,
  patientName,
  patientAge,
  patientGender,
  date,
  onRegenerate,
  regenerating,
}: PrescriptionPadProps) {
  const padRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = padRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Georgia, serif; padding: 32px; color: #111; font-size: 13px; }
            .rx-header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
            .rx-doctor-name { font-size: 18px; font-weight: bold; }
            .rx-doctor-spec { font-size: 12px; color: #555; margin-top: 2px; }
            .rx-date { font-size: 12px; }
            .rx-patient-row { display: flex; gap: 32px; padding: 10px 0; border-bottom: 1px solid #ccc; margin-bottom: 20px; font-size: 12px; }
            .rx-patient-label { color: #666; margin-right: 4px; }
            .rx-symbol { font-size: 28px; font-style: italic; font-weight: bold; margin-bottom: 12px; }
            .rx-med { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #ddd; }
            .rx-med:last-child { border-bottom: none; }
            .rx-med-name { font-size: 15px; font-weight: bold; }
            .rx-med-dosage { font-size: 13px; color: #333; margin-top: 2px; }
            .rx-med-sig { font-size: 12px; color: #555; margin-top: 4px; }
            .rx-med-instr { font-size: 11px; color: #777; margin-top: 3px; font-style: italic; }
            .rx-footer { margin-top: 40px; border-top: 1px solid #111; padding-top: 8px; display: flex; justify-content: flex-end; }
            .rx-sig-line { font-size: 12px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.onafterprint = () => win.close();
    win.print();
  };

  const displayDate = date
    ? format(new Date(date), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  const patientInfo = [
    patientName,
    patientAge ? `${patientAge} yrs` : null,
    patientGender,
  ].filter(Boolean).join(" · ");

  return (
    <div className="space-y-3">
      {/* Prescription pad */}
      <div
        ref={padRef}
        className="border border-gray-300 rounded-lg bg-white p-5 font-serif"
      >
        {/* Header */}
        <div className="rx-header flex justify-between items-end border-b-2 border-gray-800 pb-3 mb-4">
          <div>
            <p className="rx-doctor-name text-base font-bold text-gray-900">
              {doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`}
            </p>
            {doctorSpecialization && (
              <p className="rx-doctor-spec text-xs text-gray-500 mt-0.5">{doctorSpecialization}</p>
            )}
          </div>
          <div className="rx-date text-xs text-gray-500">{displayDate}</div>
        </div>

        {/* Patient row */}
        <div className="rx-patient-row flex gap-6 py-2 border-b border-gray-200 mb-4 text-xs text-gray-700">
          <span><span className="rx-patient-label text-gray-400">Patient: </span>{patientInfo}</span>
        </div>

        {/* Rx symbol */}
        <div className="rx-symbol text-2xl font-bold italic text-gray-800 mb-3">℞</div>

        {/* Medications */}
        <div className="space-y-4">
          {medications.map((med, i) => (
            <div key={i} className="rx-med pb-3 border-b border-dashed border-gray-200 last:border-0 last:pb-0">
              <p className="rx-med-name font-bold text-sm text-gray-900">
                {i + 1}. {med.name}
                {v(med.dosage) && <span className="font-normal text-gray-600 ml-1">— {v(med.dosage)}</span>}
              </p>
              {(v(med.frequency) || v(med.duration)) && (
                <p className="rx-med-sig text-xs text-gray-600 mt-1">
                  Sig:{" "}
                  {[v(med.frequency), v(med.duration)].filter(Boolean).join(", ")}
                </p>
              )}
              {med.instructions && med.instructions !== "null" && (
                <p className="rx-med-instr text-xs text-gray-500 italic mt-1">{med.instructions}</p>
              )}
            </div>
          ))}
        </div>

        {/* Signature footer */}
        <div className="rx-footer mt-8 pt-3 border-t border-gray-800 flex justify-end">
          <div className="rx-sig-line text-right">
            <div className="w-40 border-t border-gray-400 mb-1" />
            <p className="text-sm font-semibold text-gray-900">
              {doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`}
            </p>
            {doctorSpecialization && (
              <p className="text-xs text-gray-500">{doctorSpecialization}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={handlePrint}
        >
          <Printer className="w-3 h-3" />
          Print
        </Button>
        {onRegenerate && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        )}
      </div>
    </div>
  );
}
