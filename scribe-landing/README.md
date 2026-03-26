# Scribe — Landing Page

Marketing landing page for the Scribe clinical AI scribe platform. Built with Next.js 16 and Framer Motion. Includes a demo request form that sends leads via email using Resend.

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Forms | react-hook-form + zod |
| Email | Resend |

## Prerequisites

- Node.js 20+
- Resend account + API key (for the demo request form)

## Setup

```bash
cd scribe-landing
npm install
cp .env.local.example .env.local
```

`.env.local`:
```env
RESEND_API_KEY=re_...
CONTACT_EMAIL=your@email.com   # where demo requests are sent
```

## Running

```bash
npm run dev     # http://localhost:3001
npm run build
npm run lint
```

## Project Structure

```
scribe-landing/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   ├── page.tsx            # Main landing page — composes all sections
│   │   └── api/
│   │       └── demo-request/
│   │           └── route.ts    # POST handler — validates form + sends email via Resend
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx      # Top nav with CTA button
│   │   │   └── Footer.tsx
│   │   ├── sections/
│   │   │   ├── Hero.tsx        # Above-the-fold hero with animated headline
│   │   │   ├── Problem.tsx     # Pain points doctors face today
│   │   │   ├── Features.tsx    # Core product features grid
│   │   │   ├── HowItWorks.tsx  # Step-by-step workflow
│   │   │   ├── SocialProof.tsx # Testimonials / trust indicators
│   │   │   ├── Pricing.tsx     # Pricing tiers
│   │   │   ├── FAQ.tsx         # Frequently asked questions
│   │   │   └── DemoForm.tsx    # Demo request form (react-hook-form + Resend)
│   │   └── ui/                 # shadcn/ui primitives
│   │
│   └── lib/
│       ├── utils.ts            # cn() classname helper
│       └── submissions.ts      # Form submission types / helpers
│
└── public/                     # Static assets
```

## Demo Request Form

The `/api/demo-request` route:
1. Validates the POST body with zod (name, email, practice, message)
2. Sends a formatted email to `CONTACT_EMAIL` via the Resend API
3. Returns `{ success: true }` or a validation error

## Deployment

Deploy to Vercel — zero config needed for a Next.js App Router project. Set the two environment variables (`RESEND_API_KEY`, `CONTACT_EMAIL`) in the Vercel dashboard under Project Settings > Environment Variables.
