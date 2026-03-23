const steps = [
  {
    number: "01",
    title: "Record",
    description: "Open a session in your browser. Scribe captures the consultation live — no hardware, no app download.",
  },
  {
    number: "02",
    title: "Transcribe",
    description: "Every word is transcribed in real time using Deepgram's medical-grade AI with speaker separation.",
  },
  {
    number: "03",
    title: "Generate",
    description: "SOAP note, vitals, prescriptions, and follow-up tasks — all produced simultaneously in seconds.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex items-start">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">How it works</p>
          </div>

          {/* Steps */}
          <div className="lg:pl-12 py-12 lg:py-16">
            <h2 className="text-3xl font-bold text-black tracking-tight mb-10">
              Three steps. That&#39;s it.
            </h2>
            <div className="grid sm:grid-cols-3 gap-0 border border-black/10">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="p-8 border-r border-black/10 last:border-0 flex flex-col gap-4"
                >
                  <span className="text-xs text-black/25 font-medium">{step.number}</span>
                  <h3 className="font-semibold text-black text-base">{step.title}</h3>
                  <p className="text-black/50 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
