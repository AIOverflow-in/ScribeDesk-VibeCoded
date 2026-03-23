"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { DashboardMetrics } from "@/lib/types";
import { Users, Activity, FileText, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = metrics
    ? [
        { label: "Total Patients", value: metrics.total_patients, icon: Users, color: "text-blue-500" },
        { label: "Encounters", value: metrics.total_encounters, icon: Activity, color: "text-green-500" },
        { label: "Reports", value: metrics.reports_generated, icon: FileText, color: "text-purple-500" },
        { label: "Pending Tasks", value: metrics.pending_tasks, icon: CheckSquare, color: "text-orange-500" },
      ]
    : [];

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="pt-6 h-24 animate-pulse bg-slate-100 rounded" /></Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-8 h-8 ${color}`} />
                      <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Encounters</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.recent_encounters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No encounters yet.</p>
                ) : (
                  <div className="space-y-3">
                    {metrics?.recent_encounters.map((enc) => (
                      <div key={enc.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{enc.patient_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">
                            {new Date(enc.created_at).toLocaleDateString()}
                          </span>
                          <Badge variant={enc.status === "FINISHED" ? "default" : "secondary"} className="text-xs">
                            {enc.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
