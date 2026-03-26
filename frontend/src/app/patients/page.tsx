"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Patient } from "@/lib/types";
import { getPatients, createPatient } from "@/lib/api/patients";
import { Search, Plus, User } from "lucide-react";
import { toast } from "sonner";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", age: "", gender: "" });
  const [saving, setSaving] = useState(false);

  const load = () => getPatients().then(setPatients).catch(console.error);
  useEffect(() => { load(); }, []);

  const filtered = patients.filter((p) => {
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.phone ?? "").includes(q);
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createPatient({
        name: form.name.trim(),
        phone: form.phone || undefined,
        email: form.email || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
      });
      setShowCreate(false);
      setForm({ name: "", phone: "", email: "", age: "", gender: "" });
      load();
      toast.success("Patient created");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Patients</h1>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Patient
          </Button>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{query ? "No patients match your search." : "No patients yet."}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Age</th>
                  <th className="text-left px-4 py-3 font-medium">Gender</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer hover:bg-muted/40 transition-colors ${i !== filtered.length - 1 ? "border-b" : ""}`}
                    onClick={() => router.push(`/patients/${p.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.age ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{p.gender ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                    placeholder="e.g. 34"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="patient@example.com"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={saving || !form.name.trim()}
                >
                  {saving ? "Creating..." : "Create Patient"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
