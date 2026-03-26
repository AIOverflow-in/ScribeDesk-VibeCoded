"use client";

import { useState } from "react";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
