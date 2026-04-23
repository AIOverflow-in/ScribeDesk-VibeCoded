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
  // Silent client-side enrichment
  timezone: z.string().optional(),
  browserLanguage: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  msclkid: z.string().optional(),
  timeOnPageSecs: z.number().optional(),
  maxScrollPct: z.number().optional(),
  sectionsViewed: z.array(z.string()).optional(),
  visitCount: z.number().optional(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
  devicePixelRatio: z.number().optional(),
  connectionType: z.string().optional(),
  saveData: z.boolean().optional(),
  prefersDarkMode: z.boolean().optional(),
});

interface IpGeo {
  status?: string;
  country?: string;
  regionName?: string;
  city?: string;
  isp?: string;
  timezone?: string;
  mobile?: boolean;
  proxy?: boolean;
}

async function resolveGeo(ip: string): Promise<IpGeo> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,timezone,mobile,proxy`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return {};
    return res.json() as Promise<IpGeo>;
  } catch {
    return {};
  }
}

function parseDevice(ua: string): string {
  const mobile = /mobile|android|iphone|ipad/i.test(ua);
  const os = /windows nt/i.test(ua) ? "Windows"
    : /mac os x/i.test(ua) ? "macOS"
    : /android/i.test(ua) ? "Android"
    : /iphone/i.test(ua) ? "iOS (iPhone)"
    : /ipad/i.test(ua) ? "iOS (iPad)"
    : /linux/i.test(ua) ? "Linux"
    : "Unknown OS";
  const browser = /edg\//i.test(ua) ? "Edge"
    : /opr\//i.test(ua) ? "Opera"
    : /chrome/i.test(ua) ? "Chrome"
    : /firefox/i.test(ua) ? "Firefox"
    : /safari/i.test(ua) ? "Safari"
    : "Unknown Browser";
  return `${mobile ? "Mobile" : "Desktop"} · ${browser} · ${os}`;
}

function fmtTime(secs: number): string {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function row(label: string, value: string | number | boolean | undefined | null): string {
  return `<tr><td style="padding:7px 10px;font-weight:600;width:160px;color:#333;white-space:nowrap">${label}</td><td style="padding:7px 10px;color:#555">${value ?? "—"}</td></tr>`;
}

function sectionHeader(title: string): string {
  return `<tr><td colspan="2" style="padding:10px 10px 6px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;background:#f5f5f5;border-top:1px solid #e0e0e0">${title}</td></tr>`;
}

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

  const {
    name, email, specialty, practiceSize, challenge,
    timezone, browserLanguage, referrer,
    utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
    gclid, fbclid, msclkid,
    timeOnPageSecs, maxScrollPct, sectionsViewed, visitCount,
    screenWidth, screenHeight, devicePixelRatio,
    connectionType, saveData, prefersDarkMode,
  } = result.data;

  // ── Server-side enrichment ──────────────────────────────────────────
  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";
  const httpReferer = req.headers.get("referer") ?? referrer ?? "—";
  const acceptLanguage = req.headers.get("accept-language") ?? "—";
  const dnt = req.headers.get("dnt");
  const platform = req.headers.get("sec-ch-ua-platform")?.replace(/"/g, "") ?? null;
  const isMobileHint = req.headers.get("sec-ch-ua-mobile");
  const secFetchUser = req.headers.get("sec-fetch-user");

  const geo = await resolveGeo(rawIp);
  const device = parseDevice(userAgent);

  const location = geo.status === "success"
    ? [geo.city, geo.regionName, geo.country].filter(Boolean).join(", ")
    : "—";
  const geoTimezone = geo.timezone ?? timezone ?? "—";
  const viaProxy = geo.proxy ? "Yes (VPN/Proxy detected)" : "No";
  const mobileNetwork = geo.mobile ? "Mobile data" : "Broadband/Wi-Fi";
  const deviceStr = platform && isMobileHint
    ? `${isMobileHint === "?1" ? "Mobile" : "Desktop"} · ${platform}`
    : device;
  const screenStr = screenWidth && screenHeight
    ? `${screenWidth}×${screenHeight}${devicePixelRatio && devicePixelRatio > 1 ? ` @ ${devicePixelRatio}x` : ""}`
    : "—";
  const scrollStr = maxScrollPct != null ? `${maxScrollPct}%` : "—";
  const timeStr = timeOnPageSecs != null ? fmtTime(timeOnPageSecs) : "—";
  const sectionsStr = sectionsViewed?.length ? sectionsViewed.join(", ") : "—";
  const visitStr = visitCount != null ? (visitCount === 1 ? "1st visit" : `${visitCount}th visit`) : "—";
  const connStr = connectionType ? `${connectionType}${saveData ? " · Save-Data ON" : ""}` : "—";
  const hasAttribution = utmSource || utmMedium || utmCampaign || gclid || fbclid || msclkid;

  const submission = {
    id: randomUUID(),
    name, email, specialty, practiceSize, challenge,
    ip: rawIp, location, isp: geo.isp, timezone: geoTimezone,
    device: deviceStr, screen: screenStr,
    referrer: httpReferer, utmSource, utmMedium, utmCampaign,
    gclid, fbclid, timeOnPageSecs, maxScrollPct, sectionsViewed, visitCount,
    submittedAt: new Date().toISOString(),
  };

  try { appendSubmission(submission); } catch (err) {
    console.error("Failed to save submission:", err);
  }

  const resendKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;

  if (resendKey && ownerEmail) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Scribe <onboarding@resend.dev>",
        to: ownerEmail,
        subject: `New demo request from ${name} · ${location !== "—" ? location : "Unknown location"}`,
        html: `
<div style="font-family:sans-serif;font-size:14px;max-width:640px">
  <h2 style="margin:0 0 16px;font-size:20px;color:#111">New Demo Request</h2>
  <table style="border-collapse:collapse;width:100%;border:1px solid #e0e0e0">
    ${sectionHeader("Lead")}
    ${row("Name", name)}
    ${row("Email", email)}
    ${row("Specialty", specialty)}
    ${row("Practice Size", practiceSize)}
    ${row("Challenge", challenge ?? "—")}

    ${sectionHeader("Location & Network")}
    ${row("Location", location)}
    ${row("ISP / Org", geo.isp ?? "—")}
    ${row("Timezone", geoTimezone)}
    ${row("Network type", mobileNetwork)}
    ${row("VPN / Proxy", viaProxy)}
    ${row("IP", `<span style="color:#aaa;font-size:12px">${rawIp}</span>`)}

    ${sectionHeader("Device & Browser")}
    ${row("Device", deviceStr)}
    ${row("Screen", screenStr)}
    ${row("Connection", connStr)}
    ${row("Browser language", browserLanguage ?? acceptLanguage)}
    ${row("Dark mode", prefersDarkMode != null ? (prefersDarkMode ? "Yes" : "No") : "—")}
    ${row("Do Not Track", dnt === "1" ? "On" : "Off")}
    ${row("Bot check", secFetchUser === "?1" ? "User-initiated ✓" : "—")}

    ${sectionHeader("Engagement")}
    ${row("Time on page", timeStr)}
    ${row("Scroll depth", scrollStr)}
    ${row("Sections viewed", sectionsStr)}
    ${row("Visit number", visitStr)}

    ${sectionHeader("Attribution")}
    ${row("HTTP Referrer", httpReferer)}
    ${row("UTM Source", utmSource ?? "—")}
    ${row("UTM Medium", utmMedium ?? "—")}
    ${row("UTM Campaign", utmCampaign ?? "—")}
    ${row("UTM Term", utmTerm ?? "—")}
    ${row("UTM Content", utmContent ?? "—")}
    ${hasAttribution ? row("Google Click ID", gclid ?? "—") : ""}
    ${hasAttribution ? row("Facebook Click ID", fbclid ?? "—") : ""}
    ${hasAttribution ? row("Microsoft Click ID", msclkid ?? "—") : ""}

    ${sectionHeader("Meta")}
    ${row("Submitted", submission.submittedAt)}
    ${row("Submission ID", submission.id)}
  </table>
</div>`,
      });
    } catch (err) {
      console.error("Failed to send notification email:", err);
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
