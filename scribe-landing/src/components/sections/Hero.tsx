export default function Hero() {
  return (
    <section className="pt-14 bg-white border-b border-black/10">
      {/* Top grid row — headline + meta */}
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_auto] border-b border-black/10">
        {/* Headline */}
        <div className="py-16 lg:py-24 border-r border-black/10 pr-12">
          <p className="text-xs text-black/40 uppercase tracking-widest font-medium mb-6">
            Clinical AI Scribe · HIPAA &amp; GDPR Compliant
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black leading-[1.05] tracking-tight max-w-2xl">
            From consultation to clinical notes. Automatically.
          </h1>
          <p className="mt-6 text-black/50 text-lg max-w-xl leading-relaxed">
            ScribeDesk listens to your patient conversations in real time — transcribing, generating SOAP notes, ICD-10 billing codes, after-visit summaries, and flagging drug interactions. Built for UK and US clinicians.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <a
              href="#demo"
              className="bg-black hover:bg-black/80 text-white font-medium px-6 py-3 text-sm transition-colors"
            >
              Request a Demo
            </a>
            <a
              href="#how-it-works"
              className="text-black/50 hover:text-black text-sm transition-colors"
            >
              See how it works →
            </a>
          </div>
        </div>

        {/* Stats column */}
        <div className="hidden lg:grid grid-rows-3 pl-12 py-16 lg:py-24 gap-0 w-64">
          {[
            { value: "< 20s", label: "Note generation time" },
            { value: "3.5h", label: "Admin saved per day" },
            { value: "7", label: "Languages supported" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col justify-center border-b border-black/10 last:border-0 pb-6 last:pb-0 pt-6 first:pt-0">
              <div className="text-3xl font-bold text-black">{stat.value}</div>
              <div className="text-xs text-black/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust bar */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-black/30 font-medium uppercase tracking-widest">
        <span>Deepgram Medical AI</span>
        <span className="w-px h-3 bg-black/10 hidden sm:block" />
        <span>GPT-5.4</span>
        <span className="w-px h-3 bg-black/10 hidden sm:block" />
        <span>HIPAA Compliant</span>
        <span className="w-px h-3 bg-black/10 hidden sm:block" />
        <span>GDPR Ready</span>
        <span className="w-px h-3 bg-black/10 hidden sm:block" />
        <span>ICD-10 / CPT Billing</span>
        <span className="w-px h-3 bg-black/10 hidden sm:block" />
        <span>Multilingual</span>
      </div>
    </section>
  );
}
