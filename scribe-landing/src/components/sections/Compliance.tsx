const items = [
  {
    standard: "HIPAA",
    region: "United States",
    controls: [
      "§ 164.312(b) — PHI audit log on every access",
      "§ 164.312(a)(2)(iii) — 15-minute auto-logoff",
      "§ 164.312(d) — Account lockout after 5 failed attempts",
      "Business Associate Agreement (BAA) acceptance flow",
      "No raw audio stored — privacy by design",
    ],
  },
  {
    standard: "GDPR / UK GDPR",
    region: "United Kingdom & EU",
    controls: [
      "Right to erasure — cascade delete across all patient data",
      "Right to data portability — full JSON export",
      "Data residency selection (UK or US)",
      "Lawful basis logging for all PHI access",
      "Data minimisation — audio discarded after transcription",
    ],
  },
  {
    standard: "UK DSPT",
    region: "NHS / England",
    controls: [
      "Access control audit trail per NHS Data Security Standard",
      "Encrypted data at rest and in transit (TLS 1.3)",
      "Role-based access (Doctor / Super Admin)",
      "Incident response logging",
      "Password complexity and account lockout policies",
    ],
  },
];

export default function Compliance() {
  return (
    <section id="compliance" className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex flex-col gap-3 justify-start">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">Compliance</p>
            <p className="text-xs text-black/30 leading-relaxed hidden lg:block">
              Built to meet HIPAA, UK GDPR, and NHS DSPT requirements at the code level — not just on paper.
            </p>
          </div>

          {/* Content */}
          <div className="lg:pl-12 py-12 lg:py-16">
            <h2 className="text-3xl font-bold text-black tracking-tight mb-2">
              Clinical compliance built in from day one.
            </h2>
            <p className="text-black/40 text-sm mb-10 max-w-xl">
              ScribeDesk implements HIPAA, GDPR, and NHS DSPT controls at the infrastructure and application level — not a checkbox exercise.
            </p>

            <div className="grid sm:grid-cols-3 border border-black/10">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="p-6 border-r border-black/10 last:border-0 flex flex-col gap-4"
                >
                  <div>
                    <div className="text-sm font-bold text-black">{item.standard}</div>
                    <div className="text-xs text-black/30 mt-0.5">{item.region}</div>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {item.controls.map((ctrl, j) => (
                      <li key={j} className="text-xs text-black/60 flex items-start gap-2">
                        <span className="text-black/25 flex-shrink-0 mt-0.5">✓</span>
                        {ctrl}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="text-xs text-black/25 mt-4">
              SOC 2 Type II audit in progress. Enterprise customers receive a signed BAA and full compliance documentation.{" "}
              <a href="mailto:hello@scribedesk.app" className="underline underline-offset-2 hover:text-black/50 transition-colors">
                Request compliance pack →
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
