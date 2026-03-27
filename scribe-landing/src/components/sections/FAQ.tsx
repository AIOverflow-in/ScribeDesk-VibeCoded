"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is my patient data secure?",
    a: "ScribeDesk does not store raw audio recordings. Transcripts and clinical summaries are stored encrypted and access-controlled per account. We follow strict data minimisation principles.",
  },
  {
    q: "Does ScribeDesk work in the UK?",
    a: "Yes — built for UK clinical workflows. Medical transcription is optimised for British English accents, NHS terminology, and UK medication naming conventions.",
  },
  {
    q: "Do I need any special hardware?",
    a: "No. ScribeDesk runs entirely in your web browser. Any modern device with a microphone works — nothing to install.",
  },
  {
    q: "How accurate is the transcription?",
    a: "ScribeDesk uses Deepgram's nova-2-medical model, achieving industry-leading accuracy for clinical speech including drug names, dosages, and diagnoses.",
  },
  {
    q: "Can I try it before committing?",
    a: "Yes. The Free plan gives you 10 consultations per month with no credit card required.",
  },
  {
    q: "What happens after I request a demo?",
    a: "We'll reach out within 24 hours to arrange a call. We'll show you a live walkthrough tailored to your specialty.",
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
          <div className="lg:pl-12 py-12 lg:py-16 max-w-xl">
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
