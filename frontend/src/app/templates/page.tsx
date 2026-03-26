"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Template } from "@/lib/types";
import { listTemplates, createTemplate, deleteTemplate, updateTemplate } from "@/lib/api/templates";
import { Plus, Lock, Trash2, Search, FileText, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "CUSTOM", content: "" });

  const load = () => listTemplates().then(setTemplates).catch(console.error);
  useEffect(() => { load(); }, []);

  const select = (tmpl: Template) => {
    setSelected(tmpl);
    setEditContent(tmpl.content);
    setEditName(tmpl.name);
    setMode("preview");
  };

  const handleSave = async () => {
    if (!selected || selected.is_predefined) return;
    setSaving(true);
    try {
      await updateTemplate(selected.id, { content: editContent, name: editName });
      await load();
      setSelected((prev) => prev ? { ...prev, content: editContent, name: editName } : prev);
      setMode("preview");
      toast.success("Template saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    if (selected?.id === id) setSelected(null);
    load();
    toast.success("Template deleted");
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const created = await createTemplate(form);
      setShowCreate(false);
      setForm({ name: "", type: "CUSTOM", content: "" });
      await load();
      select(created);
      toast.success("Template created");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const predefined = templates.filter((t) => t.is_predefined && t.name.toLowerCase().includes(query.toLowerCase()));
  const custom = templates.filter((t) => !t.is_predefined && t.name.toLowerCase().includes(query.toLowerCase()));

  const isHtml = selected?.content.trimStart().startsWith("<");

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">

        {/* ── LEFT: template list ── */}
        <div className="w-72 shrink-0 border-r flex flex-col bg-muted/20">
          {/* Header */}
          <div className="px-4 pt-5 pb-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-base font-semibold">Templates</h1>
              <Button size="sm" className="h-7 gap-1.5 text-xs px-2.5" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5" /> New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-xs"
                placeholder="Search templates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* Predefined */}
            {predefined.length > 0 && (
              <div>
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Predefined
                </p>
                {predefined.map((t) => (
                  <TemplateRow
                    key={t.id}
                    template={t}
                    active={selected?.id === t.id}
                    onClick={() => select(t)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* My Templates */}
            {custom.length > 0 && (
              <div className="mt-1">
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  My Templates
                </p>
                {custom.map((t) => (
                  <TemplateRow
                    key={t.id}
                    template={t}
                    active={selected?.id === t.id}
                    onClick={() => select(t)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {predefined.length === 0 && custom.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No templates found.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: preview / editor ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <FileText className="w-10 h-10 opacity-20" />
              <p className="text-sm">Select a template to preview it</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {mode === "edit" ? (
                    <input
                      className="text-lg font-semibold bg-transparent border-b border-black/20 focus:border-black outline-none px-0 min-w-0 w-64"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    <h2 className="text-lg font-semibold truncate">{selected.name}</h2>
                  )}
                  <Badge variant="outline" className="text-xs shrink-0">{selected.type}</Badge>
                  {selected.is_predefined && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Lock className="w-3 h-3" /> Read-only
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!selected.is_predefined && mode === "preview" && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setMode("edit")}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                  )}
                  {mode === "edit" && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => { setMode("preview"); setEditContent(selected.content); setEditName(selected.name); }}>
                        Cancel
                      </Button>
                      <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  )}
                  {!selected.is_predefined && mode === "preview" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(selected.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Preview / Edit toggle (only for HTML content in preview mode) */}
              {mode === "preview" && isHtml && (
                <div className="px-6 pt-3 pb-0 shrink-0">
                  <span className="text-xs text-muted-foreground italic">Rendered preview</span>
                </div>
              )}

              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                {mode === "preview" ? (
                  isHtml ? (
                    <div
                      className="px-8 py-6 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selected.content }}
                    />
                  ) : (
                    <pre className="px-8 py-6 text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                      {selected.content}
                    </pre>
                  )
                ) : (
                  <div className="p-6 h-full flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Use <code className="bg-muted px-1 py-0.5 rounded text-xs">[PLACEHOLDER]</code> markers where the AI should fill in clinical data.
                      </p>
                    </div>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 font-mono text-xs resize-none min-h-[500px]"
                      placeholder="Write your template content here..."
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create dialog */}
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
                  placeholder="e.g. Cardiology Follow-Up"
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
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Content *</Label>
                <span className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">[PLACEHOLDER]</code> for AI fill-in
                </span>
              </div>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Chief Complaint: [CHIEF_COMPLAINT]&#10;&#10;History: [HISTORY]&#10;&#10;Assessment: [ASSESSMENT]&#10;&#10;Plan: [PLAN]"
                rows={12}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex gap-2 pt-1">
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
    </AppShell>
  );
}

function TemplateRow({
  template,
  active,
  onClick,
  onDelete,
}: {
  template: Template;
  active: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "w-full text-left px-4 py-2.5 flex items-start justify-between gap-2 group transition-colors cursor-pointer",
        active ? "bg-black text-white" : "hover:bg-muted/60"
      )}
    >
      <div className="min-w-0">
        <p className={cn("text-sm font-medium truncate", active ? "text-white" : "text-foreground")}>
          {template.name}
        </p>
        <p className={cn("text-xs truncate mt-0.5", active ? "text-white/60" : "text-muted-foreground")}>
          {template.content.replace(/<[^>]*>/g, " ").trim().slice(0, 60)}…
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {template.is_predefined ? (
          <Lock className={cn("w-3 h-3", active ? "text-white/50" : "text-muted-foreground")} />
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
            className={cn(
              "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
              active ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
