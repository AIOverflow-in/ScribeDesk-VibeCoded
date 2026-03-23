const testimonials = [
  {
    quote: "I used to stay an hour after clinic finishing notes. With Scribe, I'm out the door with my patients.",
    name: "Dr. Sarah Mitchell",
    role: "GP, North London",
    initials: "SM",
  },
  {
    quote: "The SOAP notes are accurate enough that I only need minor edits. The prescription suggestions are a great safety net.",
    name: "Dr. James Okafor",
    role: "Consultant Physician, Birmingham",
    initials: "JO",
  },
  {
    quote: "I was sceptical AI could handle medical vocabulary. It transcribes drug names and conditions correctly almost every time.",
    name: "Dr. Priya Sharma",
    role: "Paediatrician, Manchester",
    initials: "PS",
  },
];

export default function SocialProof() {
  return (
    <section className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex items-start">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">Early access</p>
          </div>

          {/* Cards */}
          <div className="lg:pl-12 py-12 lg:py-16">
            <div className="grid sm:grid-cols-3 border border-black/10">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="p-6 border-r border-black/10 last:border-0 flex flex-col justify-between gap-6"
                >
                  <p className="text-black/70 text-sm leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-black text-xs font-semibold">{t.name}</div>
                      <div className="text-black/40 text-xs">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-black/25 text-xs mt-4">
              Testimonials are from early access participants.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
