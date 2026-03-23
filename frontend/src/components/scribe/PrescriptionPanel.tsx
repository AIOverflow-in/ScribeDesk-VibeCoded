"use client";
import { useState } from "react";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { Medication } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function PrescriptionPanel() {
  const { prescriptions } = useEncounterStore();
  const [approved, setApproved] = useState(false);

  if (!prescriptions.length) {
    return (
      <p className="text-sm text-gray-400">
        Medication suggestions will appear after the session is finished.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {prescriptions.map((med, i) => (
        <MedicationRow key={i} med={med} />
      ))}
      {!approved ? (
        <Button
          size="sm"
          className="w-full gap-2 mt-2 bg-black text-white hover:bg-gray-800"
          onClick={() => setApproved(true)}
        >
          <Check className="w-4 h-4" />
          Approve Prescription
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
          <Check className="w-4 h-4" />
          Prescription Approved
        </div>
      )}
    </div>
  );
}

function MedicationRow({ med }: { med: Medication }) {
  return (
    <div className="p-3 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-sm text-gray-900">{med.name}</p>
        {med.dosage && (
          <span className="text-xs border border-gray-200 px-1.5 py-0.5 rounded text-gray-500">{med.dosage}</span>
        )}
      </div>
      {(med.frequency || med.duration) && (
        <p className="text-xs text-gray-400 mt-1">
          {[med.frequency, med.duration].filter(Boolean).join(" · ")}
        </p>
      )}
      {med.instructions && (
        <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
      )}
    </div>
  );
}
