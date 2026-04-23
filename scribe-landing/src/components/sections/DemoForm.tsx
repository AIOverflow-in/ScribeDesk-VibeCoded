"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  specialty: z.string().min(1, "Please select a specialty"),
  practiceSize: z.string().min(1, "Please select a practice size"),
  challenge: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const specialties = [
  "GP / Family Medicine",
  "General Surgery",
  "Psychiatry",
  "Paediatrics",
  "Cardiology",
  "Oncology",
  "Orthopaedics",
  "Dermatology",
  "Neurology",
  "Other",
];

const practiceSizes = ["Solo practitioner", "Small practice (2–10)", "Hospital / NHS Trust"];

const inputClass = (err: boolean) =>
  `w-full border px-3 py-2.5 text-sm text-black placeholder-black/30 outline-none focus:ring-1 transition-all bg-white ${
    err ? "border-black/60 focus:ring-black/60" : "border-black/15 focus:ring-black/40 focus:border-black/40"
  }`;

export default function DemoForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Engagement tracking refs
  const pageLoadTime = useRef<number>(0);
  const maxScrollPct = useRef<number>(0);
  const sectionsViewed = useRef<string[]>([]);
  const visitCount = useRef<number>(1);

  useEffect(() => {
    pageLoadTime.current = performance.now();

    // Scroll depth
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const pct = Math.round((window.scrollY / docHeight) * 100);
        maxScrollPct.current = Math.max(maxScrollPct.current, pct);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Section visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting && id && !sectionsViewed.current.includes(id)) {
            sectionsViewed.current.push(id);
          }
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll("section[id]").forEach((s) => observer.observe(s));

    // Visit count
    try {
      const stored = localStorage.getItem("sd_visits");
      const count = stored ? parseInt(stored) + 1 : 1;
      localStorage.setItem("sd_visits", count.toString());
      visitCount.current = count;
    } catch {}

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);

    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection;
    const enrichment = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browserLanguage: navigator.language,
      referrer: document.referrer || undefined,
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmTerm: params.get("utm_term") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
      gclid: params.get("gclid") ?? undefined,
      fbclid: params.get("fbclid") ?? undefined,
      msclkid: params.get("msclkid") ?? undefined,
      timeOnPageSecs: Math.round((performance.now() - pageLoadTime.current) / 1000),
      maxScrollPct: maxScrollPct.current,
      sectionsViewed: sectionsViewed.current,
      visitCount: visitCount.current,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      connectionType: conn?.effectiveType ?? undefined,
      saveData: conn?.saveData ?? undefined,
      prefersDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
    };

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...enrichment }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setServerError((json as { error?: string }).error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  }

  return (
    <section id="demo" className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[240px_1fr]">
          {/* Label */}
          <div className="py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-black/10 lg:pr-12 flex flex-col gap-3">
            <p className="text-xs text-black/40 uppercase tracking-widest font-medium">Request Demo</p>
            <p className="text-black/50 text-sm leading-relaxed">
              We&#39;ll reach out within 24 hours to arrange a personalised walkthrough.
            </p>
          </div>

          {/* Form */}
          <div className="lg:pl-12 py-12 lg:py-16 max-w-xl">
            {submitted ? (
              <div className="border border-black/10 p-8 text-center">
                <div className="text-2xl font-bold text-black mb-2">Done.</div>
                <p className="text-black/50 text-sm">
                  We&#39;ll be in touch within 24 hours to arrange your demo.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-black/60">
                      Full name <span className="text-black">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Dr. Jane Smith"
                      {...register("name")}
                      className={inputClass(!!errors.name)}
                    />
                    {errors.name && <p className="text-xs text-black/60">{errors.name.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-black/60">
                      Email <span className="text-black">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="jane@practice.nhs.uk"
                      {...register("email")}
                      className={inputClass(!!errors.email)}
                    />
                    {errors.email && <p className="text-xs text-black/60">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-black/60">
                    Specialty <span className="text-black">*</span>
                  </label>
                  <select
                    {...register("specialty")}
                    defaultValue=""
                    className={inputClass(!!errors.specialty) + " bg-white"}
                  >
                    <option value="" disabled>Select specialty</option>
                    {specialties.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.specialty && <p className="text-xs text-black/60">{errors.specialty.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-black/60">
                    Practice size <span className="text-black">*</span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {practiceSizes.map((size) => (
                      <label key={size} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={size}
                          {...register("practiceSize")}
                          className="accent-black"
                        />
                        <span className="text-sm text-black/70">{size}</span>
                      </label>
                    ))}
                  </div>
                  {errors.practiceSize && <p className="text-xs text-black/60">{errors.practiceSize.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-black/60">
                    Biggest documentation challenge{" "}
                    <span className="text-black/30 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. I spend 2 hours on notes every evening..."
                    {...register("challenge")}
                    className={inputClass(false) + " resize-none"}
                  />
                </div>

                {serverError && (
                  <p className="text-xs text-black/60 border border-black/10 px-3 py-2">{serverError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black hover:bg-black/80 disabled:opacity-50 text-white font-medium py-3 text-sm transition-colors mt-1"
                >
                  {isSubmitting ? "Sending..." : "Request My Demo"}
                </button>

                <p className="text-xs text-black/30">No spam. We&#39;ll respond within 24 hours.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
