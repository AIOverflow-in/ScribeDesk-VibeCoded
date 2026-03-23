"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Patient } from "@/lib/types";
import { searchPatients, createPatient } from "@/lib/api/patients";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { toast } from "sonner";

export function PatientSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", phone: "", age: "", gender: "" });
  const [isCreating, setIsCreating] = useState(false);
  const { patient, setPatient } = useEncounterStore();
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    try {
      const data = await searchPatients(q);
      setResults(data);
      setShowDropdown(true);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimer.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(searchTimer.current);
  }, [query, doSearch]);

  const selectPatient = (p: Patient) => {
    setPatient(p);
    setQuery("");
    setShowDropdown(false);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setIsCreating(true);
    try {
      const patient = await createPatient({
        name: createForm.name,
        phone: createForm.phone || undefined,
        age: createForm.age ? parseInt(createForm.age) : undefined,
        gender: createForm.gender || undefined,
      });
      setPatient(patient);
      setShowCreate(false);
      setCreateForm({ name: "", phone: "", age: "", gender: "" });
      toast.success("Patient created");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create patient");
    } finally {
      setIsCreating(false);
    }
  };

  if (patient) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <UserCircle className="w-8 h-8 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{patient.name}</p>
          <p className="text-xs text-muted-foreground">
            {[patient.age && `${patient.age}y`, patient.gender, patient.phone].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPatient(null)}
          className="text-xs text-muted-foreground"
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patient by name or phone..."
          className="pl-9"
          onFocus={() => query && setShowDropdown(true)}
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b last:border-b-0"
              onClick={() => selectPatient(p)}
            >
              <UserCircle className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[p.age && `${p.age}y`, p.gender, p.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
          ))}
          <button
            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-blue-600"
            onClick={() => { setShowCreate(true); setShowDropdown(false); }}
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Create new patient</span>
          </button>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={createForm.age}
                  onChange={(e) => setCreateForm((f) => ({ ...f, age: e.target.value }))}
                  placeholder="32"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={createForm.gender}
                onChange={(e) => setCreateForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={isCreating || !createForm.name.trim()}>
                {isCreating ? "Creating..." : "Create Patient"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
