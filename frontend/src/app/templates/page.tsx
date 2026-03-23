"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Template } from "@/lib/types";
import { listTemplates, createTemplate, deleteTemplate } from "@/lib/api/templates";
import { Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "CUSTOM", content: "" });
  const [saving, setSaving] = useState(false);

  const load = () => listTemplates().then(setTemplates).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await createTemplate(form);
      setShowCreate(false);
      setForm({ name: "", type: "CUSTOM", content: "" });
      load();
      toast.success("Template created");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    load();
    toast.success("Template deleted");
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Templates</h1>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{tmpl.name}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">{tmpl.type}</Badge>
                    {tmpl.is_predefined ? (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                        onClick={() => handleDelete(tmpl.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {tmpl.content.replace(/<[^>]*>/g, " ").trim()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Template name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="CUSTOM">Custom</option>
                    <option value="SOAP">SOAP</option>
                    <option value="DISCHARGE">Discharge</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="PRESCRIPTION">Prescription</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Content (HTML or plain text) *</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Use [PLACEHOLDER] for AI fill-in areas..."
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={saving || !form.name.trim() || !form.content.trim()}
                >
                  {saving ? "Creating..." : "Create Template"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
