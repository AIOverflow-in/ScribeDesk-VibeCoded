"use client";
import { create } from "zustand";
import {
  Encounter, Patient, TranscriptSegment, PartialAnalysis,
  ClinicalSummary, Vitals, Medication, FinalAnalysis
} from "../types";

export type RecordingStatus = "idle" | "recording" | "paused" | "finishing" | "done";

interface EncounterState {
  encounter: Encounter | null;
  patient: Patient | null;
  segments: TranscriptSegment[];
  interimText: string;
  partialAnalysis: PartialAnalysis | null;
  summary: ClinicalSummary | null;
  vitals: Vitals | null;
  prescriptions: Medication[];
  isProcessing: boolean;
  isConnected: boolean;
  recordingStatus: RecordingStatus;

  setPatient: (p: Patient | null) => void;
  setEncounter: (e: Encounter | null) => void;
  setConnected: (v: boolean) => void;
  setInterim: (text: string) => void;
  addSegment: (seg: TranscriptSegment) => void;
  setPartialAnalysis: (a: PartialAnalysis) => void;
  applyFinalAnalysis: (data: FinalAnalysis) => void;
  setSummary: (s: ClinicalSummary | null) => void;
  setPrescriptions: (meds: Medication[]) => void;
  setProcessing: (v: boolean) => void;
  setRecordingStatus: (s: RecordingStatus) => void;
  reset: () => void;
}

const initial = {
  encounter: null,
  patient: null,
  segments: [] as TranscriptSegment[],
  interimText: "",
  partialAnalysis: null,
  summary: null,
  vitals: null,
  prescriptions: [] as Medication[],
  isProcessing: false,
  isConnected: false,
  recordingStatus: "idle" as RecordingStatus,
};

export const useEncounterStore = create<EncounterState>((set) => ({
  ...initial,

  setPatient: (patient) => set({ patient }),
  setEncounter: (encounter) => set({ encounter }),
  setConnected: (isConnected) => set({ isConnected }),
  setInterim: (interimText) => set({ interimText }),

  addSegment: (seg) => set((state) => ({
    segments: [...state.segments, seg],
    interimText: "",
  })),

  setPartialAnalysis: (partialAnalysis) => set({ partialAnalysis }),

  applyFinalAnalysis: (data) => set({
    summary: data.summary || null,
    vitals: data.vitals || null,
    prescriptions: data.prescriptions || [],
    isProcessing: false,
  }),

  setSummary: (summary) => set({ summary }),
  setPrescriptions: (prescriptions) => set({ prescriptions }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setRecordingStatus: (recordingStatus) => set({ recordingStatus }),

  reset: () => set(initial),
}));
