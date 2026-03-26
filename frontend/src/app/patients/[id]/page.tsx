"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Patient, PatientEncounterSummary } from "@/lib/types";
import { getPatient } from "@/lib/api/patients";
import { getPatientEncounters } from "@/lib/api/patients";
import { generatePrescription } from "@/lib/api/encounters";
import { ArrowLeft, Calendar, FileText, Pill, ChevronRight, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durationLabel(start?: string, end?: string) {
  if (!start || !end) return null;
  const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ${secs % 60}s`;
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [encounters, setEncounters] = useState<PatientEncounterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingRx, setGeneratingRx] = useState<string | null>(null); // encounter id being generated

  useEffect(() => {
    if (!id) return;
    Promise.all([getPatient(id), getPatientEncounters(id)])
      .then(([p, encs]) => {
        setPatient(p);
        setEncounters(encs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="p-6 text-sm text-muted-foreground">Patient not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-4xl">
        {/* Back */}
        <button
          onClick={() => router.push("/patients")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Patients
        </button>

        {/* Patient header */}
        <div className="bg-muted/40 border rounded-xl p-5 mb-6">
          <h1 className="text-xl font-bold mb-1">{patient.name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {patient.age && <span>{patient.age} yrs</span>}
            {patient.gender && <span className="capitalize">{patient.gender}</span>}
            {patient.phone && <span>{patient.phone}</span>}
            {patient.email && <span>{patient.email}</span>}
          </div>
        </div>

        {/* Consultations */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Consultations ({encounters.length})</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => router.push(`/scribe/new?patient_id=${patient.id}`)}
          >
            <FileText className="w-3.5 h-3.5" /> New Scribe
          </Button>
        </div>

        {encounters.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-xl">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No consultations yet for this patient.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {encounters.map((enc) => {
              const meds = enc.medications;
              const handleGenRx = async (e: React.MouseEvent) => {
                e.stopPropagation();
                setGeneratingRx(enc.id);
                try {
                  const generated = await generatePrescription(enc.id);
                  setEncounters((prev) =>
                    prev.map((e) => e.id === enc.id ? { ...e, medications: generated } : e)
                  );
                  if (generated.length === 0) toast.info("No medications found.");
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : "Failed to generate prescription");
                } finally {
                  setGeneratingRx(null);
                }
              };

              return (
                <div
                  key={enc.id}
                  className="border rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/scribe/${enc.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{formatDate(enc.start_time ?? enc.created_at)}</span>
                      {durationLabel(enc.start_time, enc.end_time) && (
                        <span className="text-xs text-muted-foreground">
                          · {durationLabel(enc.start_time, enc.end_time)}
                        </span>
                      )}
                      {enc.template_name && (
                        <Badge variant="outline" className="text-xs">{enc.template_name}</Badge>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>

                  {enc.summary ? (
                    <div className="space-y-1.5 mb-3">
                      {enc.summary.chief_complaint && (
                        <p className="text-sm">
                          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide mr-1.5">Chief Complaint</span>
                          {enc.summary.chief_complaint}
                        </p>
                      )}
                      {enc.summary.assessment && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          <span className="font-medium text-xs uppercase tracking-wide mr-1.5">Assessment</span>
                          {enc.summary.assessment}
                        </p>
                      )}
                      {enc.summary.diagnosis && enc.summary.diagnosis.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {enc.summary.diagnosis.map((d, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{d}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-3 italic">No clinical summary available.</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t gap-2">
                    {meds.length > 0 ? (
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Pill className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {meds.map((m, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">
                              {m.name}{m.dosage ? ` ${m.dosage}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic flex-1">No medications</span>
                    )}
                    {enc.status === "FINISHED" && enc.summary && (
                      <button
                        onClick={handleGenRx}
                        disabled={generatingRx === enc.id}
                        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground border rounded px-2 py-1 hover:bg-muted/60 transition-colors disabled:opacity-50"
                      >
                        {generatingRx === enc.id
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                          : <><Pill className="w-3 h-3" /> {meds.length > 0 ? "Regenerate" : "Generate Rx"}</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
