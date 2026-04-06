const plans = [
  {
    name: "Free",
    price: "£0",
    period: "/month",
    description: "Try ScribeDesk. No credit card required.",
    badge: null,
    features: [
      "10 consultations / month",
      "Basic SOAP notes",
      "1 report template",
      "7-day transcript history",
      "Community support",
    ],
    locked: ["ICD-10 / CPT billing codes", "Drug interaction checker", "Patient summaries", "Letter generator", "PDF exports"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "£29",
    period: "/month",
    description: "Everything a solo practice needs.",
    badge: "Most popular",
    features: [
      "100 consultations / month",
      "Full SOAP + vitals extraction",
      "ICD-10 / CPT billing codes",
      "After-visit patient summaries",
      "Drug interaction checker",
      "Referral & sick note letters",
      "Prescription Pad",
      "Differential diagnosis (live)",
      "All templates + PDF exports",
      "90-day history",
      "Email support",
    ],
    locked: [],
    cta: "Request a Demo",
    highlight: true,
  },
  {
    name: "Practice",
    price: "£79",
    period: "/month",
    description: "For clinics with multiple doctors.",
    badge: null,
    features: [
      "Unlimited consultations",
      "Everything in Starter",
      "Up to 3 doctors",
      "Pre-visit prep brief",
      "Evidence-based suggestions",
      "Multilingual transcription",
      "EHR copy helper",
      "Encounter sharing & handover",
      "PHI audit log access",
      "Priority support",
    ],
    locked: [],
    cta: "Request a Demo",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex items-start">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">Pricing</p>
          </div>

          {/* Plans */}
          <div className="lg:pl-12 py-12 lg:py-16">
            <h2 className="text-3xl font-bold text-black tracking-tight mb-2">
              Simple, transparent pricing.
            </h2>
            <p className="text-black/40 text-sm mb-10">
              Starter at £29 undercuts all mid-tier competitors significantly. Freed starts at $39, Heidi at $110.
            </p>

            <div className="grid sm:grid-cols-3 border border-black/10">
              {plans.map((plan, i) => (
                <div
                  key={i}
                  className={`flex flex-col p-6 border-r border-black/10 last:border-0 ${plan.highlight ? "bg-black text-white" : "bg-white"}`}
                >
                  {/* Name + badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-semibold ${plan.highlight ? "text-white" : "text-black"}`}>
                      {plan.name}
                    </span>
                    {plan.badge && (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-white text-black">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-black"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ml-1 ${plan.highlight ? "text-white/50" : "text-black/40"}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`text-xs mb-6 ${plan.highlight ? "text-white/50" : "text-black/40"}`}>
                    {plan.description}
                  </p>

                  {/* CTA */}
                  <a
                    href="#demo"
                    className={`block text-center text-xs font-medium py-2.5 mb-6 transition-colors ${
                      plan.highlight
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-black text-white hover:bg-black/80"
                    }`}
                  >
                    {plan.cta}
                  </a>

                  {/* Features */}
                  <ul className="flex flex-col gap-2 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className={`text-xs flex items-start gap-2 ${plan.highlight ? "text-white/80" : "text-black/70"}`}>
                        <span className="mt-0.5 flex-shrink-0">—</span>
                        {f}
                      </li>
                    ))}
                    {plan.locked.map((f, j) => (
                      <li key={j} className={`text-xs flex items-start gap-2 ${plan.highlight ? "text-white/20" : "text-black/20"}`}>
                        <span className="mt-0.5 flex-shrink-0">—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Enterprise */}
            <div className="border border-black/10 border-t-0 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-semibold text-black">Enterprise</span>
                <span className="text-sm text-black/40 ml-3">
                  Custom volumes, EHR integration, HIPAA BAA, DSPT toolkit, and SLAs for hospitals and NHS trusts.
                </span>
              </div>
              <a
                href="mailto:hello@scribedesk.app"
                className="text-xs text-black/50 hover:text-black underline underline-offset-4 transition-colors flex-shrink-0"
              >
                Contact us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
