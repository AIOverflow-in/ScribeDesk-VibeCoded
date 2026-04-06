"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/authStore";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, loadUser } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    specialization: "",
    signature_url: "",
    clinic_logo_url: "",
    letterhead_text: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        specialization: user.specialization || "",
        signature_url: user.signature_url || "",
        clinic_logo_url: user.clinic_logo_url || "",
        letterhead_text: user.letterhead_text || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/doctors/me", { method: "PATCH", body: JSON.stringify(form) });
      await loadUser();
      toast.success("Profile updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-xl space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doctor Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Specialization</Label>
              <Input
                value={form.specialization}
                onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                placeholder="General Physician"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-slate-50" />
            </div>
          </CardContent>
        </Card>

        {/* Signature & Letterhead */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signature & Letterhead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Signature Image URL</Label>
              <Input
                value={form.signature_url}
                onChange={(e) => setForm((f) => ({ ...f, signature_url: e.target.value }))}
                placeholder="https://... (publicly accessible image)"
              />
              <p className="text-xs text-gray-400">Used on prescription pads and formal letters. Upload to a CDN or image host first.</p>
              {form.signature_url && (
                <img src={form.signature_url} alt="Signature preview" className="mt-2 max-h-12 border border-gray-200 rounded p-1" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Clinic Logo URL</Label>
              <Input
                value={form.clinic_logo_url}
                onChange={(e) => setForm((f) => ({ ...f, clinic_logo_url: e.target.value }))}
                placeholder="https://... (publicly accessible image)"
              />
              {form.clinic_logo_url && (
                <img src={form.clinic_logo_url} alt="Logo preview" className="mt-2 max-h-12 border border-gray-200 rounded p-1" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Custom Letterhead Text</Label>
              <textarea
                value={form.letterhead_text}
                onChange={(e) => setForm((f) => ({ ...f, letterhead_text: e.target.value }))}
                placeholder={"Dr. John Smith\nCity Health Clinic\n123 Main Street, London\nTel: 020 1234 5678"}
                rows={4}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
              />
              <p className="text-xs text-gray-400">Appears at the top of generated letters. Leave blank to use your name and specialization.</p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-black text-white hover:bg-gray-800">
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </AppShell>
  );
}
