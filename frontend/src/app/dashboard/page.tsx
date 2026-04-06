"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { DashboardMetrics } from "@/lib/types";
import { Users, Activity, FileText, CheckSquare, Clock, TrendingUp, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completionRate = metrics
    ? metrics.total_encounters > 0
      ? Math.round((metrics.finished_encounters / metrics.total_encounters) * 100)
      : 0
    : 0;

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
          <Button onClick={() => router.push("/scribe/new")} className="gap-2 bg-black text-white hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Patients"
                value={metrics?.total_patients ?? 0}
                icon={Users}
                iconColor="bg-blue-50 text-blue-500"
              />
              <StatCard
                label="Sessions"
                value={metrics?.total_encounters ?? 0}
                sub={`${completionRate}% completed`}
                icon={Activity}
                iconColor="bg-green-50 text-green-500"
              />
              <StatCard
                label="Time Saved"
                value={`${metrics?.time_saved_hours ?? 0}h`}
                sub="est. 3.5h per session"
                icon={Clock}
                iconColor="bg-purple-50 text-purple-500"
              />
              <StatCard
                label="Pending Tasks"
                value={metrics?.pending_tasks ?? 0}
                sub={`${metrics?.completed_tasks ?? 0} completed`}
                icon={CheckSquare}
                iconColor="bg-orange-50 text-orange-500"
              />
            </div>

            {/* Reports & completion row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">Reports Generated</p>
                </div>
                <p className="text-4xl font-bold text-gray-900">{metrics?.reports_generated ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">Session Completion</p>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-gray-900">{completionRate}%</p>
                  <p className="text-sm text-gray-400 mb-1">{metrics?.finished_encounters ?? 0} / {metrics?.total_encounters ?? 0}</p>
                </div>
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recent encounters */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Recent Sessions</h2>
                <button
                  className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
                  onClick={() => router.push("/scribe")}
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {(!metrics?.recent_encounters || metrics.recent_encounters.length === 0) ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  No sessions yet.{" "}
                  <button className="text-black underline" onClick={() => router.push("/scribe/new")}>
                    Start your first recording
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {metrics!.recent_encounters.map((enc) => (
                    <button
                      key={enc.id}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => router.push(`/scribe/${enc.id}`)}
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{enc.patient_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(enc.created_at), "MMM d, yyyy · h:mm a")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={enc.status === "FINISHED" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {enc.status}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
