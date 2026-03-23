import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { appendSubmission } from "@/lib/submissions";
import { randomUUID } from "crypto";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  specialty: z.string().min(1, "Please select a specialty"),
  practiceSize: z.string().min(1, "Please select a practice size"),
  challenge: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { name, email, specialty, practiceSize, challenge } = result.data;

  const submission = {
    id: randomUUID(),
    name,
    email,
    specialty,
    practiceSize,
    challenge,
    submittedAt: new Date().toISOString(),
  };

  // Persist to file
  try {
    appendSubmission(submission);
  } catch (err) {
    console.error("Failed to save submission:", err);
  }

  // Send notification email via Resend (if API key configured)
  const resendKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;

  if (resendKey && ownerEmail) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Scribe <onboarding@resend.dev>",
        to: ownerEmail,
        subject: `New demo request from ${name}`,
        html: `
          <h2>New Demo Request</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Specialty</td><td style="padding:8px">${specialty}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Practice Size</td><td style="padding:8px">${practiceSize}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Challenge</td><td style="padding:8px">${challenge ?? "—"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Submitted</td><td style="padding:8px">${submission.submittedAt}</td></tr>
          </table>
        `,
      });
    } catch (err) {
      console.error("Failed to send notification email:", err);
      // Don't fail the request if email fails
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
