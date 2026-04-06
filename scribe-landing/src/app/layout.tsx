import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scribedesk.app"),
  title: {
    default: "ScribeDesk — AI Medical Scribe for Doctors | SOAP Notes, Billing Codes, Drug Interactions",
    template: "%s | ScribeDesk",
  },
  description:
    "ScribeDesk is an AI clinical scribe that transcribes patient consultations in real time, auto-generates SOAP notes, ICD-10/CPT billing codes, after-visit summaries, referral letters, and flags drug interactions. HIPAA-compliant. Built for UK and US clinicians.",
  keywords: [
    "AI medical scribe",
    "clinical AI scribe",
    "ambient AI scribe",
    "medical transcription",
    "SOAP notes generator",
    "ICD-10 billing codes",
    "CPT code suggestions",
    "after-visit summary",
    "referral letter generator",
    "drug interaction checker",
    "AI doctor assistant",
    "clinical documentation automation",
    "HIPAA compliant AI scribe",
    "NHS AI scribe",
    "UK clinical AI",
    "Deepgram medical transcription",
    "GPT-5 clinical notes",
    "multilingual medical transcription",
    "sick note generator",
    "prescription AI",
  ],
  authors: [{ name: "ScribeDesk", url: "https://scribedesk.app" }],
  creator: "ScribeDesk",
  publisher: "ScribeDesk",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://scribedesk.app",
  },
  openGraph: {
    title: "ScribeDesk — AI Medical Scribe for Doctors",
    description:
      "Real-time ambient transcription → SOAP notes, billing codes, drug interaction alerts, referral letters, and patient summaries. HIPAA & GDPR compliant.",
    url: "https://scribedesk.app",
    siteName: "ScribeDesk",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ScribeDesk — AI Clinical Scribe for Doctors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScribeDesk — AI Medical Scribe for Doctors",
    description:
      "Ambient AI scribe: SOAP notes, ICD-10/CPT billing codes, drug interaction alerts, referral letters. HIPAA & GDPR compliant.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://scribedesk.app/#software",
      name: "ScribeDesk",
      url: "https://scribedesk.app",
      description:
        "AI-powered clinical scribe for doctors. Real-time medical transcription, SOAP note generation, ICD-10/CPT billing codes, drug interaction checks, referral letters, and patient after-visit summaries.",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "GBP",
          description: "10 consultations per month, basic SOAP notes",
        },
        {
          "@type": "Offer",
          name: "Starter",
          price: "29",
          priceCurrency: "GBP",
          description: "100 consultations/month, all features, 1 doctor",
        },
        {
          "@type": "Offer",
          name: "Practice",
          price: "79",
          priceCurrency: "GBP",
          description: "Unlimited consultations, 3 doctors, team features",
        },
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://scribedesk.app/#org",
      name: "ScribeDesk",
      url: "https://scribedesk.app",
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@scribedesk.app",
        contactType: "customer support",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://scribedesk.app/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is ScribeDesk HIPAA compliant?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. ScribeDesk implements HIPAA-required audit controls (§164.312(b)), automatic session logoff after 15 minutes (§164.312(a)(2)(iii)), account lockout after failed login attempts (§164.312(d)), and Business Associate Agreement (BAA) acceptance. No raw audio is ever stored.",
          },
        },
        {
          "@type": "Question",
          name: "Does ScribeDesk generate ICD-10 and CPT billing codes?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. ScribeDesk automatically suggests ICD-10 diagnosis codes and CPT procedure codes from the consultation transcript and SOAP summary. Doctors review and accept codes before export.",
          },
        },
        {
          "@type": "Question",
          name: "Does ScribeDesk work in the UK (NHS)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. ScribeDesk is built for UK clinical workflows with British English accent support, NHS terminology, UK medication naming, GDPR compliance, and data residency options.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
