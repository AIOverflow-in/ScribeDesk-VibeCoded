"use client";

import { useState, useEffect } from "react";

const STEP_DURATION = 4000; // ms per step

const steps = [
  {
    number: "01",
    title: "Record",
    description:
      "Open a session in your browser. ScribeDesk captures the consultation live — no hardware, no app download.",
  },
  {
    number: "02",
    title: "Transcribe",
    description:
      "Every word is transcribed in real time using Deepgram's medical-grade AI with speaker separation across 7 languages.",
  },
  {
    number: "03",
    title: "Generate",
    description:
      "SOAP note, vitals, ICD-10 billing codes, prescriptions, drug interaction check, and patient summary — all in seconds.",
  },
];

/* ─── Step 1: waveform ──────────────────────────────────────────── */
const BAR_HEIGHTS = [30, 55, 70, 45, 80, 60, 35, 75, 50, 65, 40, 85, 55, 45, 70, 35, 60, 75, 50, 40];

function RecordDemo() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-black"
            style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }}
          />
          <span className="font-medium text-black">Recording</span>
        </div>
        <span className="text-black/30 font-mono">00:42</span>
      </div>

      {/* Waveform */}
      <div className="flex items-end gap-[3px] h-16">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-black origin-bottom"
            style={{
              height: `${h}%`,
              animation: `wave-bar ${0.6 + (i % 5) * 0.1}s ease-in-out infinite`,
              animationDelay: `${(i * 0.07).toFixed(2)}s`,
              willChange: "transform",
            }}
          />
        ))}
      </div>

      {/* Speaker labels */}
      <div className="flex gap-4 text-xs text-black/30">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-black rounded-full" />
          Doctor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-black/30 rounded-full" />
          Patient
        </span>
      </div>
    </div>
  );
}

/* ─── Step 2: live transcript ───────────────────────────────────── */
const TRANSCRIPT_LINES = [
  { speaker: "Doctor", text: "How long have you had this cough?" },
  { speaker: "Patient", text: "About three weeks now. It's worse at night." },
  { speaker: "Doctor", text: "Any fever or shortness of breath?" },
  { speaker: "Patient", text: "Mild fever, 37.8. No trouble breathing." },
];

function TranscriptDemo({ active }: { active: boolean }) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!active) { setVisibleLines(0); return; }
    setVisibleLines(0);
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setVisibleLines(n);
      if (n >= TRANSCRIPT_LINES.length) clearInterval(id);
    }, 800);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-black">Live Transcript</span>
        <span
          className="text-black/30"
          style={{ animation: "blink-cursor 1s step-end infinite" }}
        >
          |
        </span>
      </div>
      {TRANSCRIPT_LINES.map((line, i) => (
        <div
          key={i}
          className="flex flex-col gap-0.5"
          style={{
            opacity: i < visibleLines ? 1 : 0,
            animation: i < visibleLines ? "slide-up-fade 0.35s ease-out both" : "none",
          }}
        >
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${line.speaker === "Doctor" ? "text-black" : "text-black/40"}`}>
            {line.speaker}
          </span>
          <p className="text-xs text-black/70 leading-relaxed">{line.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Step 3: generated output ──────────────────────────────────── */
const SOAP_SECTIONS = [
  { label: "S", title: "Subjective", text: "3-week productive cough, worse at night. Low-grade fever 37.8°C. No dyspnoea." },
  { label: "O", title: "Objective", text: "Temp 37.8°C · HR 82 · SpO₂ 98% · Chest clear on auscultation" },
  { label: "A", title: "Assessment", text: "Acute bronchitis, likely viral" },
  { label: "P", title: "Plan", text: "Supportive care. Amoxicillin 500mg TDS × 5 days if no improvement." },
];

function GenerateDemo({ active }: { active: boolean }) {
  const [visibleCards, setVisibleCards] = useState(0);

  useEffect(() => {
    if (!active) { setVisibleCards(0); return; }
    setVisibleCards(0);
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setVisibleCards(n);
      if (n >= SOAP_SECTIONS.length) clearInterval(id);
    }, 550);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-black">SOAP Note</span>
        <span className="text-black/30 text-[10px]">GPT-5.4</span>
      </div>
      {SOAP_SECTIONS.map((s, i) => (
        <div
          key={i}
          className="border border-black/10 p-3 flex gap-3"
          style={{
            opacity: i < visibleCards ? 1 : 0,
            animation: i < visibleCards ? "slide-up-fade 0.3s ease-out both" : "none",
          }}
        >
          <span className="text-[10px] font-bold text-black/30 w-3 flex-shrink-0 mt-0.5">{s.label}</span>
          <div>
            <div className="text-[10px] font-semibold text-black uppercase tracking-widest mb-0.5">{s.title}</div>
            <p className="text-xs text-black/60 leading-relaxed">{s.text}</p>
          </div>
        </div>
      ))}
      {visibleCards >= SOAP_SECTIONS.length && (
        <div
          className="flex gap-2 mt-1"
          style={{ animation: "slide-up-fade 0.3s ease-out both" }}
        >
          <span className="text-[10px] border border-black/15 px-2 py-0.5 text-black/50 font-medium">
            ICD-10: J20.9
          </span>
          <span className="text-[10px] border border-black/15 px-2 py-0.5 text-black/50 font-medium">
            CPT: 99213
          </span>
          <span className="text-[10px] border border-black/15 px-2 py-0.5 text-black/50 font-medium">
            No drug interactions
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Main section ──────────────────────────────────────────────── */
export default function HowItWorks() {
  const [active, setActive] = useState(0);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, STEP_DURATION);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="how-it-works" className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex items-start">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">How it works</p>
          </div>

          {/* Content */}
          <div className="lg:pl-12 py-12 lg:py-16">
            <h2 className="text-3xl font-bold text-black tracking-tight mb-10">
              Three steps. That&#39;s it.
            </h2>

            <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
              {/* Steps list */}
              <div className="flex flex-col gap-0 border border-black/10">
                {steps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`text-left p-6 border-b border-black/10 last:border-0 flex gap-5 items-start transition-colors ${
                      active === i ? "bg-black text-white" : "bg-white hover:bg-black/[0.02]"
                    }`}
                  >
                    {/* Progress bar */}
                    <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                      <span className={`text-xs font-medium ${active === i ? "text-white/50" : "text-black/25"}`}>
                        {step.number}
                      </span>
                      {active === i && (
                        <div className="w-px flex-1 min-h-[2px] bg-white/20 overflow-hidden mt-1">
                          <div
                            className="w-full bg-white/60"
                            style={{
                              height: "100%",
                              animation: `slide-up-fade ${STEP_DURATION}ms linear both`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold text-base mb-1 ${active === i ? "text-white" : "text-black"}`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${active === i ? "text-white/60" : "text-black/50"}`}>
                        {step.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Animated demo — fixed height prevents layout reflow on mobile */}
              <div className="border border-black/10 p-6 h-[280px] overflow-hidden flex flex-col justify-start">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 mb-5 pb-4 border-b border-black/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-black/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-black/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-black/10" />
                  <span className="ml-3 text-[10px] text-black/25 font-mono">scribedesk.app</span>
                </div>

                {active === 0 && <RecordDemo />}
                {active === 1 && <TranscriptDemo active={active === 1} />}
                {active === 2 && <GenerateDemo active={active === 2} />}
              </div>
            </div>

            {/* Step dots (mobile) */}
            <div className="flex gap-2 mt-6 lg:hidden justify-center">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${active === i ? "bg-black" : "bg-black/15"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
