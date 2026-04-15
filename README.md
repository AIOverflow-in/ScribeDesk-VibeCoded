# ScribeDesk — Clinical AI Scribe

ScribeDesk is a full-stack clinical AI scribe application that lets doctors record patient consultations and automatically generates structured medical documentation — SOAP notes, prescriptions, follow-up tasks, billing codes, and more — powered by real-time speech-to-text and large language models.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Demo Credentials](#demo-credentials)
- [Make Commands](#make-commands)
- [API Overview](#api-overview)
- [WebSocket Protocol](#websocket-protocol)
- [Deployment](#deployment)

---

## Features

### Real-Time Scribe Recording
- Stream audio to Deepgram's `nova-2-medical` model via WebSocket for live transcription
- Interim word-by-word display as the doctor speaks, with final utterance segments saved to the database
- Pause, resume, and finish controls; recording auto-pauses on disconnect and resumes on reconnect
- Upload full-session audio (WebM) as a gap-filling fallback if the WebSocket drops

### AI-Powered Clinical Analysis
- **Partial analysis every 30 s** — live key points, symptoms, and provisional diagnoses while recording
- **Full analysis on finish** — four parallel GPT-4o calls generating:
  - SOAP clinical summary (Subjective, Objective, Assessment, Plan)
  - Vitals extraction (BP, HR, temperature, weight, height, SpO₂, RR)
  - Prescription suggestions (drug, dose, frequency, duration)
  - Follow-up task list with due dates
- Regenerate any analysis at any time, optionally with a custom template
- Drug interaction checking across the generated medication list
- Evidence-based clinical recommendations per diagnosis
- ICD-10 and CPT billing code suggestions
- Plain-English patient-facing after-visit summary
- Pre-visit brief generated from the patient's last five encounters

### Patient Management
- Create and search patients by name or phone number
- Per-patient encounter history with SOAP summaries and medications at a glance

### Documentation & Templates
- Four built-in templates (SOAP Note, Discharge Summary, Referral Letter, Prescription) and unlimited custom templates
- One-click report generation that fills template placeholders from encounter data
- Rich text editor with PDF export
- EHR-formatted SOAP export for pasting into external systems
- Read-only shareable encounter links (tokenised, no auth required)
- Referral letters, sick notes, and patient instruction letters

### Task Management
- Auto-extracted tasks from encounter analysis
- Manual task creation with title, description, and due date
- Status workflow: Pending → In Progress → Completed / Cancelled

### Context-Aware Chat
- Ask questions about any encounter; the LLM receives the full transcript as context
- Streaming token-by-token responses via Server-Sent Events

### Dashboard & Admin
- Metrics: total patients, encounters, reports, pending tasks
- Recent encounter list with duration and patient info
- Super-admin panel: create/manage doctor accounts, reset passwords, view per-doctor metrics

### Compliance & Security
- JWT access tokens (15 min) + refresh tokens (7 days) with secure rotation
- Business Associate Agreement (BAA) acceptance tracking for HIPAA
- Doctor attestation / sign-off on AI-generated notes
- HIPAA audit logging for all PHI access
- bcrypt password hashing with account lockout

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend framework** | Python 3.12 · FastAPI 0.115 · Uvicorn |
| **Database** | MongoDB 7 · Motor (async driver) · Beanie ODM |
| **Speech-to-text** | Deepgram SDK 3.8 (`nova-2-medical`, WebSocket streaming) |
| **AI / LLM** | OpenAI API (GPT-4o / GPT-4o-mini) |
| **Authentication** | JWT (python-jose) · bcrypt / passlib |
| **File storage** | MinIO (S3-compatible) / Cloudflare R2 |
| **PDF generation** | WeasyPrint 62 |
| **Frontend framework** | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| **UI components** | shadcn/ui · Base UI · Tailwind CSS 4 |
| **State management** | Zustand 5 |
| **Forms** | React Hook Form 7 · Zod 4 |
| **Rich text editor** | Tiptap 3 |
| **Notifications** | Sonner 2 |
| **Charts** | Recharts 3 |
| **Audio capture** | Web MediaRecorder API (WebM / Opus) |

---

## Project Structure

```
ScribeDesk/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, lifespan, router registration
│   │   ├── config.py                # Pydantic settings (reads from .env)
│   │   ├── database.py              # Motor + Beanie initialisation
│   │   ├── dependencies.py          # Auth middleware (get_current_user, require_role)
│   │   ├── models/                  # Beanie document models
│   │   │   ├── doctor.py
│   │   │   ├── patient.py
│   │   │   ├── encounter.py
│   │   │   ├── transcript_segment.py
│   │   │   ├── clinical_summary.py
│   │   │   ├── prescription.py
│   │   │   ├── task.py
│   │   │   ├── template.py
│   │   │   ├── report.py
│   │   │   ├── letter.py
│   │   │   ├── refresh_token.py
│   │   │   └── audit_log.py
│   │   ├── routers/                 # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── encounters.py
│   │   │   ├── websocket.py         # /ws/session/{id}
│   │   │   ├── tasks.py
│   │   │   ├── templates.py
│   │   │   ├── reports.py
│   │   │   ├── chat.py
│   │   │   ├── dashboard.py
│   │   │   ├── admin.py
│   │   │   ├── settings.py
│   │   │   └── letters.py
│   │   └── services/                # Business logic
│   │       ├── audio_processor.py   # Deepgram stream → segment storage
│   │       ├── processor_registry.py# Active session registry + idle cleanup
│   │       ├── full_analysis.py     # 4-parallel LLM calls on finish
│   │       ├── llm_service.py       # OpenAI wrapper
│   │       ├── deepgram_client.py   # Deepgram WebSocket + prerecorded
│   │       ├── prompts.py           # All LLM system prompts
│   │       └── ...
│   ├── scripts/
│   │   ├── seed_templates.py        # Seeds 4 built-in templates
│   │   ├── seed_admin.py            # Seeds demo admin + doctor accounts
│   │   └── seed_demo_data.py        # Optional demo patient data
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env                         # Local environment config (not committed)
├── frontend/
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   │   ├── dashboard/
│   │   │   ├── scribe/              # Recording workspace
│   │   │   │   ├── new/             # Start / resume encounter
│   │   │   │   └── [id]/            # Live recording + review
│   │   │   ├── patients/
│   │   │   ├── tasks/
│   │   │   ├── templates/
│   │   │   ├── settings/
│   │   │   ├── admin/doctors/
│   │   │   └── shared/[token]/      # Public read-only view
│   │   ├── components/
│   │   │   ├── scribe/              # RecordingControls, TranscriptPanel, AnalysisPanel
│   │   │   ├── layout/              # AppShell, Sidebar, Header
│   │   │   └── ui/                  # shadcn base components
│   │   └── lib/
│   │       ├── api/                 # Typed fetch wrappers per module
│   │       ├── store/               # Zustand stores (auth, encounter)
│   │       ├── websocket/           # AudioRecorder + WSClient
│   │       └── types/               # Shared TypeScript types
│   ├── .env.local                   # Frontend env config (not committed)
│   └── package.json
├── docker-compose.yml               # MongoDB + MinIO + Mongo Express
├── Makefile                         # Dev shortcuts
├── DEV.md                           # Developer guide
└── ARCHITECTURE.md                  # Architecture documentation
```

---

## Prerequisites

- **Docker Desktop** — for local MongoDB and MinIO
- **Python 3.12**
- **Node.js 20+** and **npm**
- **OpenAI API key** — [platform.openai.com](https://platform.openai.com)
- **Deepgram API key** — [console.deepgram.com](https://console.deepgram.com)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/AIOverflow-in/ScribeDesk.git
cd ScribeDesk
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your API keys (see [Environment Variables](#environment-variables)).

### 3. Configure frontend environment

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
```

### 4. Install dependencies

```bash
make install
```

### 5. Start infrastructure (MongoDB + MinIO)

```bash
make dev
```

| Service | URL |
|---|---|
| MongoDB | `localhost:27017` |
| Mongo Express (DB UI) | http://localhost:8081 |
| MinIO Console | http://localhost:9001 |

### 6. Start the backend

```bash
make backend
```

The API will be available at **http://localhost:8000**.  
Interactive docs (Swagger UI): **http://localhost:8000/docs**

On first startup the seed scripts run automatically and create the built-in templates and demo accounts.

### 7. Start the frontend

```bash
make frontend
```

The app will be available at **http://localhost:3000**.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# MongoDB
MONGODB_URL=mongodb://root:12345@localhost:27017/
MONGODB_DB_NAME=scribedesk

# JWT
JWT_SECRET=your-random-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

# Deepgram (speech-to-text)
DEEPGRAM_API_KEY=your-deepgram-key

# MinIO / S3-compatible storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=scribedesk-files
MINIO_SECURE=false          # set to true in production (HTTPS endpoint)

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Demo Credentials

Seeded automatically on first backend startup:

| Role | Email | Password |
|---|---|---|
| Doctor | `doctor@scribe.ai` | `doctor123` |
| Super Admin | `admin@scribe.ai` | `admin123` |

---

## Make Commands

```bash
make dev          # Start Docker services (MongoDB, MinIO, Mongo Express)
make stop         # Stop Docker services
make clean        # Stop Docker and delete all volumes
make install      # Install all dependencies (backend + frontend)
make backend      # Start backend dev server on port 8000
make frontend     # Start frontend dev server on port 3000
make logs         # Tail backend logs
make up           # Full Docker Compose (all services including app)
```

---

## API Overview

### Authentication
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login → access + refresh tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Revoke refresh token |
| `GET` | `/auth/me` | Current user profile |
| `POST` | `/auth/accept-baa` | Accept HIPAA BAA |

### Patients
| Method | Path | Description |
|---|---|---|
| `GET` | `/patients` | Search patients (`?q=name`) |
| `POST` | `/patients` | Create patient |
| `GET` | `/patients/{id}` | Patient details |
| `GET` | `/patients/{id}/encounters` | Patient encounter history |

### Encounters
| Method | Path | Description |
|---|---|---|
| `POST` | `/encounters/start` | Start new encounter |
| `GET` | `/encounters` | List doctor's encounters |
| `GET` | `/encounters/{id}/detail` | Full encounter detail |
| `PATCH` | `/encounters/{id}/pause` | Pause recording |
| `PATCH` | `/encounters/{id}/resume` | Resume recording |
| `POST` | `/encounters/{id}/finish` | Finish + trigger full analysis |
| `POST` | `/encounters/{id}/upload-audio` | Upload session audio (gap fill) |
| `POST` | `/encounters/{id}/regenerate-summary` | Re-run clinical summary |
| `POST` | `/encounters/{id}/generate-billing-codes` | Generate ICD-10 / CPT codes |
| `POST` | `/encounters/{id}/check-drug-interactions` | Check medication interactions |
| `POST` | `/encounters/{id}/generate-evidence` | Evidence-based recommendations |
| `POST` | `/encounters/{id}/generate-patient-summary` | Plain-English patient summary |
| `POST` | `/encounters/{id}/attest` | Doctor attestation / sign-off |
| `POST` | `/encounters/{id}/share` | Generate read-only share token |
| `GET` | `/encounters/shared/{token}` | Public read-only encounter view |
| `GET` | `/encounters/{id}/ehr-summary` | Formatted SOAP for EHR paste |
| `GET` | `/encounters/pre-visit/{patient_id}` | Pre-visit brief from past encounters |

### Other Resources
| Method | Path | Description |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/tasks` | Task CRUD |
| `GET/POST/PUT/DELETE` | `/templates` | Template CRUD |
| `POST` | `/encounters/{id}/reports` | Generate report from template |
| `PUT` | `/encounters/reports/{report_id}` | Edit report |
| `POST` | `/encounters/{id}/chat` | Streaming chat (SSE) |
| `GET` | `/dashboard/metrics` | Dashboard metrics |
| `GET/POST/PUT` | `/admin/doctors` | Doctor management (super admin) |
| `PATCH` | `/doctors/me` | Update doctor profile |
| `POST` | `/letters` | Generate letter (referral / sick note / instructions) |
| `GET` | `/health` | Health check |

---

## WebSocket Protocol

**Endpoint:** `WS /ws/session/{encounter_id}?token=<jwt>`

### Browser → Server
| Type | Format | Description |
|---|---|---|
| Binary | `ArrayBuffer` | Raw audio chunks (WebM / Opus, 250 ms intervals) |
| JSON | `{"type": "PAUSE"}` | Pause forwarding to Deepgram |
| JSON | `{"type": "RESUME"}` | Resume forwarding |
| JSON | `{"type": "FINISH"}` | Finish session and trigger full analysis |

### Server → Browser
| Message type | Description |
|---|---|
| `CONNECTED` | Session established |
| `TRANSCRIPT_INTERIM` | Live partial transcript word |
| `TRANSCRIPT_FINAL` | Completed utterance saved to DB |
| `PARTIAL_ANALYSIS` | Rolling 30-second live analysis |
| `PROCESSING_STARTED` | Full analysis running |
| `FINAL_ANALYSIS` | Complete analysis payload |
| `ERROR` | Error with details |

On disconnect without a `FINISH` message the backend automatically pauses the encounter. On reconnect the processor is pre-populated with all previously saved transcript segments so analysis context is preserved.

---

## Deployment

### Backend — Docker (Render / Railway / Fly.io)

The `backend/Dockerfile` installs WeasyPrint system dependencies and runs Uvicorn on `$PORT`.

Required environment variables (set in your hosting dashboard — do not commit secrets):
- `MONGODB_URL`, `MONGODB_DB_NAME`
- `JWT_SECRET`
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
- `DEEPGRAM_API_KEY`
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_SECURE`
- `CORS_ORIGINS` (comma-separated list of your frontend origins)

### Frontend — Vercel

```bash
vercel --prod
```

Set `NEXT_PUBLIC_API_URL` to your deployed backend URL in the Vercel project settings.

---

## License

Private — All rights reserved. © AIOverflow
