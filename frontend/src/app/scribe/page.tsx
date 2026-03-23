"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EncounterListItem } from "@/lib/types";
import { listEncounters } from "@/lib/api/encounters";
import { Plus, ChevronRight, Mic } from "lucide-react";
import { format, formatDuration, intervalToDuration } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
      status === "FINISHED"
        ? "border-black text-black bg-white"
        : status === "ACTIVE"
        ? "border-black bg-black text-white"
        : "border-gray-300 text-gray-500 bg-white"
    }`}>
      {status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />}
      {status}
    </span>
  );
}

function formatDur(secs?: number): string {
  if (!secs) return "—";
  const d = intervalToDuration({ start: 0, end: secs * 1000 });
  if (d.hours) return `${d.hours}h ${d.minutes}m`;
  if (d.minutes) return `${d.minutes}m ${d.seconds ?? 0}s`;
  return `${d.seconds ?? 0}s`;
}

export default function ScribePage() {
  const router = useRouter();
  const [encounters, setEncounters] = useState<EncounterListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEncounters()
      .then(setEncounters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Scribe Sessions</h1>
            <p className="text-sm text-gray-500 mt-0.5">All recorded consultations</p>
          </div>
          <Button onClick={() => router.push("/scribe/new")} className="gap-2 bg-black text-white hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            New Scribe
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : encounters.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
            <Mic className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No sessions yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Start your first recording session</p>
            <Button onClick={() => router.push("/scribe/new")} className="gap-2 bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4" /> New Scribe
            </Button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {encounters.map((enc) => (
                  <tr
                    key={enc.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/scribe/${enc.id}`)}
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{enc.patient_name}</p>
                      {(enc.patient_age || enc.patient_gender) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[enc.patient_age && `${enc.patient_age}y`, enc.patient_gender].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {enc.start_time ? format(new Date(enc.start_time), "MMM d, yyyy") : format(new Date(enc.created_at), "MMM d, yyyy")}
                      <p className="text-xs text-gray-400">
                        {enc.start_time ? format(new Date(enc.start_time), "h:mm a") : ""}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{formatDur(enc.duration_secs)}</td>
                    <td className="px-4 py-4"><StatusBadge status={enc.status} /></td>
                    <td className="px-4 py-4 text-gray-300">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
