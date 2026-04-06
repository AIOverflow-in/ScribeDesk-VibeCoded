const features = [
  {
    title: "Real-Time Medical Transcription",
    description:
      "Deepgram nova-2-medical captures every word with speaker separation (Doctor / Patient). Optimised for drug names, dosages, and clinical terminology across 7 languages.",
  },
  {
    title: "SOAP Note Generation",
    description:
      "Structured Subjective, Objective, Assessment, and Plan notes generated automatically from the transcript — with custom template support for any specialty.",
  },
  {
    title: "ICD-10 & CPT Billing Codes",
    description:
      "Diagnosis and procedure codes suggested from the encounter transcript. Accept or reject each code before exporting alongside your clinical PDF — so you never under-code again.",
  },
  {
    title: "After-Visit Patient Summary",
    description:
      "Plain-English summary for the patient: diagnosis, medications, follow-up instructions, and when to seek urgent care. One-click copy or printable card.",
  },
  {
    title: "Drug Interaction Checker",
    description:
      "When multiple medications are prescribed, ScribeDesk automatically flags known interactions — Minor, Moderate, or Major — with mechanism and management guidance inline.",
  },
  {
    title: "Post-Visit Letter Generator",
    description:
      "Referral letters, sick notes, and patient instruction letters generated from encounter context in seconds. Editable rich-text preview with one-click PDF download.",
  },
  {
    title: "Differential Diagnosis During Recording",
    description:
      "Real-time clinical intelligence while you consult: top 3 differential diagnoses, red flags, and suggested workup — updated every 30 seconds throughout the session.",
  },
  {
    title: "Prescription Pad",
    description:
      "Medications, dosages, frequency, and duration suggested in context. Formatted as a printable medical Rx with clinic letterhead and doctor signature.",
  },
  {
    title: "Pre-Visit Prep Brief",
    description:
      "Before starting a session, see a snapshot of the patient's prior visits: active diagnoses, current medications, pending tasks, and recent chief complaints.",
  },
  {
    title: "Multilingual Support",
    description:
      "Record consultations in English, Hindi, Arabic, Spanish, French, German, or Mandarin. SOAP notes always generated in English; patient summaries in the patient's language.",
  },
  {
    title: "Evidence-Based Suggestions",
    description:
      "Clinical guidelines relevant to the presenting complaint surfaced after each session — from NICE (UK) and USPSTF (US) guidelines, with citations.",
  },
  {
    title: "AI Chat per Encounter",
    description:
      "Ask follow-up questions, request alternative formulations, or query the transcript — with full encounter context available to the AI.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex items-start">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">Features</p>
          </div>

          {/* Grid */}
          <div className="lg:pl-12 py-12 lg:py-16">
            <h2 className="text-3xl font-bold text-black tracking-tight mb-2">
              The complete clinical documentation workflow.
            </h2>
            <p className="text-black/40 text-sm mb-10">
              Everything from transcription to billing codes and compliance letters — automated.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 border border-black/10">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="p-6 border-r border-b border-black/10 flex flex-col gap-2"
                  style={{
                    borderRight: (i + 1) % 3 === 0 ? "none" : undefined,
                    borderBottom: i >= features.length - (features.length % 3 || 3) ? "none" : undefined,
                  }}
                >
                  <h3 className="font-semibold text-black text-sm">{f.title}</h3>
                  <p className="text-black/50 text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
