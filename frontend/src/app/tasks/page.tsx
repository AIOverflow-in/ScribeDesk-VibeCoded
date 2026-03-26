"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Task } from "@/lib/types";
import { listTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks";
import { Plus, Trash2, Check, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "" });
  const [saving, setSaving] = useState(false);

  const load = () => listTasks().then(setTasks).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createTask({
        title: form.title,
        description: form.description || undefined,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
      });
      setShowCreate(false);
      setForm({ title: "", description: "", due_date: "" });
      load();
      toast.success("Task created");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const markDone = async (task: Task) => {
    await updateTask(task.id, { status: "COMPLETED" });
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    load();
    toast.success("Task deleted");
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No tasks yet. Create your first task.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Card key={task.id} className={task.status === "COMPLETED" ? "opacity-60" : ""}>
                <CardContent className="py-3 px-4 flex items-center gap-4">
                  <button
                    className="w-5 h-5 rounded border-2 border-slate-300 hover:border-green-500 flex items-center justify-center shrink-0"
                    onClick={() => task.status !== "COMPLETED" && markDone(task)}
                  >
                    {task.status === "COMPLETED" && <Check className="w-3 h-3 text-green-600" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.due_date), "MMM d")}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                      {task.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details..."
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleCreate} disabled={saving || !form.title.trim()}>
                  {saving ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

