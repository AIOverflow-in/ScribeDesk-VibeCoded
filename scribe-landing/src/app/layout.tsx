import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScribeDesk — Clinical AI Scribe for Doctors",
  description:
    "ScribeDesk listens to your patient consultations in real time, generates SOAP notes, extracts vitals, and suggests prescriptions — so you can focus on medicine, not paperwork.",
  keywords: [
    "clinical AI scribe",
    "medical transcription",
    "SOAP notes",
    "AI doctor assistant",
    "clinical documentation",
  ],
  openGraph: {
    title: "ScribeDesk — Clinical AI Scribe for Doctors",
    description:
      "Real-time AI transcription and clinical note generation. From consultation to clinical notes, automatically.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
