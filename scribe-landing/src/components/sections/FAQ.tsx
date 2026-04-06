"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is ScribeDesk HIPAA compliant?",
    a: "Yes. ScribeDesk implements the required HIPAA technical safeguards at the code level: PHI audit logging on every access (§164.312(b)), automatic session logoff after 15 minutes (§164.312(a)(2)(iii)), account lockout after 5 failed login attempts (§164.312(d)), and a Business Associate Agreement (BAA) acceptance flow. No raw audio is ever stored — transcription happens in real time and the audio stream is discarded.",
  },
  {
    q: "Does ScribeDesk work with the NHS and UK GDPR?",
    a: "Yes — built for UK clinical workflows. ScribeDesk supports UK data residency, GDPR right-to-erasure (cascade deletion of all patient data), and right to data portability (JSON export). Medical transcription is optimised for British English accents, NHS terminology, and UK medication naming conventions.",
  },
  {
    q: "Does ScribeDesk generate ICD-10 and CPT billing codes?",
    a: "Yes. At the end of each session, ScribeDesk automatically suggests ICD-10 diagnosis codes and CPT procedure codes extracted from the transcript and SOAP summary. Doctors review, accept, or reject each code before they are included in the PDF export.",
  },
  {
    q: "Can ScribeDesk flag drug interactions?",
    a: "Yes. After prescriptions are generated, ScribeDesk checks the medication list for known interactions and classifies each as Minor, Moderate, or Major — with mechanism explanation and management guidance shown inline on the Prescription Pad.",
  },
  {
    q: "What languages are supported for transcription?",
    a: "ScribeDesk supports English, Hindi, Arabic, Spanish, French, German, and Mandarin. The doctor selects the session language before recording. SOAP notes are always generated in English; patient-facing summaries can be generated in the patient's language.",
  },
  {
    q: "Does ScribeDesk replace my EHR?",
    a: "No. ScribeDesk is a documentation and billing assistant. It exports structured notes and billing codes that you copy into your EHR. An EHR copy helper formats the output for major systems (Epic, EMIS, SystmOne). Native EHR write-back integration is on the roadmap.",
  },
  {
    q: "Is my patient data secure?",
    a: "ScribeDesk does not store raw audio recordings. All data is encrypted in transit (TLS 1.3) and at rest. Access is role-controlled per account, and every access to patient data is logged in an immutable audit trail. You can select UK or US data residency.",
  },
  {
    q: "Do I need any special hardware?",
    a: "No. ScribeDesk runs entirely in your web browser. Any modern device with a microphone works — nothing to install.",
  },
  {
    q: "Can I try it before committing?",
    a: "Yes. The Free plan gives you 10 consultations per month with no credit card required.",
  },
  {
    q: "What happens after I request a demo?",
    a: "We'll reach out within 24 hours to arrange a call. We'll show you a live walkthrough tailored to your specialty and clinical workflow.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-black">{q}</span>
        <span className="text-black/30 flex-shrink-0 text-base leading-none">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <p className="text-sm text-black/50 leading-relaxed pb-4 pr-8">{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex items-start">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">FAQ</p>
          </div>

          {/* Items */}
          <div className="lg:pl-12 py-12 lg:py-16 max-w-2xl">
            {faqs.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
            <p className="text-xs text-black/30 mt-6">
              More questions?{" "}
              <a href="mailto:hello@scribedesk.app" className="underline underline-offset-2 hover:text-black transition-colors">
                Email us
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
