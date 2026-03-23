const features = [
  {
    title: "Medical Transcription",
    description: "Real-time speech-to-text using Deepgram nova-2-medical — optimised for drug names, dosages, and clinical terminology.",
  },
  {
    title: "SOAP Note Generation",
    description: "Full Subjective, Objective, Assessment, and Plan notes structured by GPT-4o from the conversation transcript.",
  },
  {
    title: "Vitals Extraction",
    description: "Blood pressure, heart rate, SpO₂, and temperature automatically parsed and surfaced from the consultation.",
  },
  {
    title: "Prescription Suggestions",
    description: "Medication, dosage, frequency, and duration suggested in context. Always reviewed by the clinician before prescribing.",
  },
  {
    title: "Follow-up Tasks",
    description: "Referrals, blood tests, and imaging requests automatically identified and added to your task list.",
  },
  {
    title: "Custom Templates",
    description: "Discharge summaries, referral letters, and prescriptions — fill any template with encounter data in one click.",
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
            <h2 className="text-3xl font-bold text-black tracking-tight mb-10">
              The full documentation workflow, automated.
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 border border-black/10">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="p-6 border-r border-b border-black/10 flex flex-col gap-2"
                  style={{
                    borderRight: (i + 1) % 3 === 0 ? "none" : undefined,
                    borderBottom: i >= features.length - 3 ? "none" : undefined,
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
