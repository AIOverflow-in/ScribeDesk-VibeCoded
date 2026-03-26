# Scribe — Frontend

Next.js 16 web application for the Scribe clinical AI scribe platform. Doctors use this interface to record patient consultations, review real-time transcriptions, and receive AI-generated clinical summaries, prescriptions, tasks, and reports.

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Markdown | react-markdown |
| Date utils | date-fns |
| Toasts | Sonner |
| Icons | Lucide React |

## Prerequisites

- Node.js 20+
- Backend running at `http://localhost:8000` (see root `DEV.md`)

## Setup

```bash
npm install
cp .env.local.example .env.local  # or create manually
```

`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

Or from the repo root:
```bash
make frontend
```

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (auth)/               # Login / register routes
│   ├── dashboard/            # Dashboard overview
│   ├── scribe/               # Recording workspace
│   │   ├── new/              # Start a new encounter
│   │   └── [id]/             # Review a completed encounter
│   ├── tasks/                # Task management
│   ├── templates/            # Clinical note templates
│   ├── reports/              # Report generation & PDF download
│   ├── settings/             # Doctor profile settings
│   └── admin/                # Super-admin doctor management
│
├── components/
│   ├── layout/               # Sidebar, navbar, page shell
│   ├── scribe/               # Recording-specific panels:
│   │   ├── RecordingPanel    # MediaRecorder + WebSocket audio
│   │   ├── TranscriptPanel   # Live + final transcript display
│   │   ├── AnalysisPanel     # Partial + final AI analysis
│   │   ├── ClinicalSummary   # SOAP summary with regenerate
│   │   ├── PrescriptionPad   # Medical Rx pad (printable)
│   │   ├── PrescriptionPanel # Wrapper feeding data to PrescriptionPad
│   │   ├── TasksPanel        # AI-extracted tasks
│   │   └── ChatPanel         # AI chat with encounter context
│   └── ui/                   # shadcn/ui primitives
│
└── lib/
    ├── api/                  # Typed fetch wrappers (auth, encounters, tasks, …)
    ├── store/                # Zustand stores:
    │   ├── authStore         # Current user + JWT token
    │   ├── encounterStore    # Active encounter, transcript, summary, prescriptions
    │   └── uiStore           # Sidebar collapse, panel layout
    ├── websocket/            # AudioRecorder (MediaRecorder) + WSClient (WS binary)
    └── types/                # Shared TypeScript interfaces
```

## Key Features

### Live Recording Session (`/scribe/new`)
- Audio captured at 48kHz via `MediaRecorder` (WebM/Opus), chunked every 250ms
- Chunks stream over WebSocket to the backend, which proxies them to Deepgram
- Interim transcripts appear word-by-word (~300ms latency) with speaker labels
- Every 30s the backend broadcasts a `PARTIAL_ANALYSIS` event with key clinical points
- On **Finish**, the backend runs a parallel analysis pipeline (summary + vitals + prescriptions + tasks) and broadcasts `FINAL_ANALYSIS` when complete

### Clinical Summary with Regeneration
- SOAP-format summary displayed with a regenerate toolbar at the top
- Doctors can swap the template (Default SOAP, custom templates) and re-run without leaving the page
- Skeleton placeholders shown during regeneration

### Prescription Pad
- Formatted medical Rx pad: doctor header, patient info, ℞ symbol, numbered medications, signature footer
- Print opens an optimized print window with Rx-appropriate CSS

### AI Chat
- Chat panel with full encounter transcript + summary as context
- Streamed responses via Server-Sent Events

## State Management

Three Zustand stores coordinate the recording session:

| Store | Key state |
|---|---|
| `authStore` | `user`, `token`, `setUser`, `logout` |
| `encounterStore` | `encounter`, `transcript`, `summary`, `prescriptions`, `setSummary`, `setPrescriptions` |
| `uiStore` | `sidebarOpen`, panel layout flags |

## WebSocket Events

The frontend handles these server-sent WebSocket message types:

| Type | Description |
|---|---|
| `TRANSCRIPT_INTERIM` | Live partial transcript (overwritten on next event) |
| `TRANSCRIPT_FINAL` | Confirmed transcript segment with speaker label |
| `PARTIAL_ANALYSIS` | 30s incremental AI analysis during recording |
| `FINAL_ANALYSIS` | Full analysis result after recording ends |

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Doctor | `doctor@scribe.ai` | `doctor123` |
| Super Admin | `admin@scribe.ai` | `admin123` |
