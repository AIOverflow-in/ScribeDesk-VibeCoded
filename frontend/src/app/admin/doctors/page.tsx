"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDoctor, listDoctors, createDoctor, setDoctorStatus, resetDoctorPassword } from "@/lib/api/admin";
import { Plus, RefreshCw, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";

export default function AdminDoctorsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showReset, setShowReset] = useState<AdminDoctor | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", specialization: "" });
  const [resetPw, setResetPw] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      router.replace("/scribe");
    }
  }, [user, router]);

  const load = () =>
    listDoctors(search || undefined)
      .then(setDoctors)
      .catch(console.error);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return;
    setSaving(true);
    try {
      await createDoctor(form);
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", specialization: "" });
      load();
      toast.success("Doctor created");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (doc: AdminDoctor) => {
    try {
      await setDoctorStatus(doc.id, !doc.is_active);
      load();
      toast.success(`Doctor ${doc.is_active ? "deactivated" : "activated"}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleResetPw = async () => {
    if (!showReset || !resetPw) return;
    setSaving(true);
    try {
      await resetDoctorPassword(showReset.id, resetPw);
      setShowReset(null);
      setResetPw("");
      toast.success("Password reset");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Doctors</h1>
            <p className="text-sm text-muted-foreground">Manage doctor accounts</p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Doctor
          </Button>
        </div>

        <div className="mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="max-w-sm"
          />
        </div>

        <div className="space-y-2">
          {doctors.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{doc.name}</p>
                    <Badge variant={doc.is_active ? "default" : "secondary"} className="text-xs">
                      {doc.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {doc.email}
                    {doc.specialization && ` · ${doc.specialization}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => { setShowReset(doc); setResetPw(""); }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset PW
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 text-xs ${doc.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}`}
                    onClick={() => toggleStatus(doc)}
                  >
                    {doc.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {doc.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {doctors.length === 0 && (
            <p className="text-center py-12 text-muted-foreground text-sm">No doctors found.</p>
          )}
        </div>

        {/* Create Doctor Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {[
                { key: "name", label: "Full Name *", placeholder: "Dr. John Smith" },
                { key: "email", label: "Email *", placeholder: "doctor@clinic.com" },
                { key: "password", label: "Password *", placeholder: "••••••••" },
                { key: "specialization", label: "Specialization", placeholder: "Cardiologist" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    type={key === "password" ? "password" : "text"}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={saving || !form.name || !form.email || !form.password}
                >
                  {saving ? "Creating..." : "Create Doctor"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={!!showReset} onOpenChange={(o) => !o && setShowReset(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password — {showReset?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowReset(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleResetPw} disabled={saving || !resetPw}>
                  {saving ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
