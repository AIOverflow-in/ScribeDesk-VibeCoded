const painPoints = [
  {
    label: "01",
    title: "Time stolen from patients",
    description: "UK doctors spend up to 3.5 hours per day on documentation — time that belongs with patients.",
  },
  {
    label: "02",
    title: "Errors under pressure",
    description: "Manual note-taking during consultations leads to gaps, inaccuracies, and incomplete records.",
  },
  {
    label: "03",
    title: "Late finishes, every day",
    description: "Catching up on notes after clinic delays follow-ups and affects patient safety.",
  },
];

export default function Problem() {
  return (
    <section className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label column */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex items-start">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">The problem</p>
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-3 lg:pl-12 py-12 lg:py-16 gap-0">
            {painPoints.map((item, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 px-6 first:pl-0 border-r border-black/10 last:border-0 pr-6"
              >
                <span className="text-xs text-black/25 font-medium">{item.label}</span>
                <h3 className="font-semibold text-black text-sm leading-snug">{item.title}</h3>
                <p className="text-black/50 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
