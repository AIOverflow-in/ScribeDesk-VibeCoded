"use client";
import { useState } from "react";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { Loader2, Pill } from "lucide-react";
import { generatePrescription } from "@/lib/api/encounters";
import { PrescriptionPad } from "./PrescriptionPad";
import { toast } from "sonner";

export function PrescriptionPanel() {
  const { encounter, patient, prescriptions, setPrescriptions } = useEncounterStore();
  const { user } = useAuthStore();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!encounter) return;
    setGenerating(true);
    try {
      const meds = await generatePrescription(encounter.id);
      setPrescriptions(meds);
      if (meds.length === 0) {
        toast.info("No medications found in this encounter.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate prescription");
    } finally {
      setGenerating(false);
    }
  };

  if (!prescriptions.length) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          Review the clinical notes above, then generate medication suggestions.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><Pill className="w-4 h-4" /> Generate Prescription</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <PrescriptionPad
      medications={prescriptions}
      doctorName={user?.name ?? ""}
      doctorSpecialization={user?.specialization}
      patientName={patient?.name ?? ""}
      patientAge={patient?.age}
      patientGender={patient?.gender}
      date={encounter?.start_time}
      onRegenerate={handleGenerate}
      regenerating={generating}
    />
  );
}
