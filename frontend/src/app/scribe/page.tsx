"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EncounterListItem } from "@/lib/types";
import { listEncounters } from "@/lib/api/encounters";
import { Plus, ChevronRight, Mic, PlayCircle, Search, X } from "lucide-react";
import { format, formatDuration, intervalToDuration, isThisWeek, isThisMonth } from "date-fns";

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

type DateFilter = "all" | "this_week" | "this_month";
type StatusFilter = "all" | "ACTIVE" | "PAUSED" | "FINISHED";

export default function ScribePage() {
  const router = useRouter();
  const [encounters, setEncounters] = useState<EncounterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    listEncounters()
      .then(setEncounters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return encounters.filter((enc) => {
      if (search && !enc.patient_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && enc.status !== statusFilter) return false;
      if (dateFilter !== "all") {
        const date = enc.start_time ? new Date(enc.start_time) : new Date(enc.created_at);
        if (dateFilter === "this_week" && !isThisWeek(date)) return false;
        if (dateFilter === "this_month" && !isThisMonth(date)) return false;
      }
      return true;
    });
  }, [encounters, search, dateFilter, statusFilter]);

  const hasFilters = search || dateFilter !== "all" || statusFilter !== "all";

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Scribe Sessions</h1>
            <p className="text-sm text-gray-500 mt-0.5">All recorded consultations</p>
          </div>
          <Button onClick={() => router.push("/scribe/new")} className="gap-2 bg-black text-white hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            New Scribe
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
            />
            {search && (
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="all">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="FINISHED">Finished</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="all">All time</option>
            <option value="this_week">This week</option>
            <option value="this_month">This month</option>
          </select>

          {hasFilters && (
            <button
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
              onClick={() => { setSearch(""); setDateFilter("all"); setStatusFilter("all"); }}
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400">No sessions match your filters.</p>
            <button className="text-xs text-gray-500 underline mt-2" onClick={() => { setSearch(""); setDateFilter("all"); setStatusFilter("all"); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-400">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</span>
            </div>
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
                {filtered.map((enc) => {
                  const isResumable = enc.status === "ACTIVE" || enc.status === "PAUSED";
                  return (
                    <tr
                      key={enc.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => isResumable
                        ? router.push(`/scribe/new?resume=${enc.id}`)
                        : router.push(`/scribe/${enc.id}`)
                      }
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
                      <td className="px-4 py-4 text-right">
                        {isResumable ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-black border border-black rounded px-2 py-1">
                            <PlayCircle className="w-3.5 h-3.5" /> Resume
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
