# Scribe — Developer Guide

Clinical AI Scribe MVP. Doctors record patient consultations and get real-time transcription, AI-generated clinical summaries, prescriptions, tasks, and reports.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12 + FastAPI + Uvicorn |
| Frontend | Next.js 16 (App Router, TypeScript) |
| Database | MongoDB 7 (Beanie ODM) |
| Transcription | Deepgram `nova-2-medical` (real-time WebSocket) |
| AI Analysis | OpenAI GPT-4o |
| File Storage | MinIO (S3-compatible) |
| Infrastructure | Docker Compose |

---

## Prerequisites

- Docker Desktop (running)
- Python 3.12
- Node.js 20+
- pip packages: `pip install -r backend/requirements.txt`
- npm packages: `cd frontend && npm install`

---

## Running Locally

### Step 1 — Start infrastructure (MongoDB + MinIO)

```bash
make dev
```

This starts MongoDB (`:27017`), Mongo Express (`:8081`), and MinIO (`:9000`/:9001`) via Docker Compose.

### Step 2 — Start backend

```bash
make backend
```

Runs `uvicorn app.main:app --reload --port 8000` from the `backend/` directory.
On first start, seeds 4 report templates and two demo accounts automatically.

### Step 3 — Start frontend

```bash
make frontend
```

Runs `next dev` from the `frontend/` directory on port 3000.

---

## Services at a Glance

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3000 | Main app |
| Backend API | http://localhost:8000 | REST + WebSocket |
| API Docs | http://localhost:8000/docs | Swagger UI |
| MongoDB | localhost:27017 | `root` / `12345` |
| Mongo Express | http://localhost:8081 | DB browser |
| MinIO Console | http://localhost:9001 | `minioadmin` / `minioadmin` |

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Doctor | `doctor@scribe.ai` | `doctor123` |
| Super Admin | `admin@scribe.ai` | `admin123` |

---

## Environment Variables

Located at `backend/.env`. Key variables:

```env
MONGODB_URL=mongodb://root:12345@localhost:27017/
MONGODB_DB_NAME=scribe

JWT_SECRET=scribe-dev-secret-key-change-in-production

OPENAI_API_KEY=<your-openai-key>
OPENAI_MODEL=gpt-4o

DEEPGRAM_API_KEY=<your-deepgram-key>

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=scribe-files

CORS_ORIGINS=http://localhost:3000
```

Frontend env at `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Core Features

### Scribe (`/scribe`)
The main workspace. Select or create a patient, then hit **Start Recording**.

- Audio captured via `MediaRecorder` (WebM/Opus, 48kHz) in 250ms chunks
- Chunks stream over WebSocket to the backend → forwarded to Deepgram in real time
- Transcription appears word-by-word (~300ms latency) with speaker labels (Doctor / Patient)
- Every 30 seconds, GPT-4o generates a partial clinical analysis (key points, possible diagnoses)
- On **Finish**, a parallel pipeline runs: SOAP summary + vitals extraction + prescription suggestions + task extraction — all in ~10–20s
- AI Chat panel lets the doctor ask questions with full encounter context

### Dashboard (`/dashboard`)
Overview of total patients, encounters, reports, and pending tasks. Shows recent encounter history.

### Tasks (`/tasks`)
Task list auto-populated from AI analysis after each session. Can be created manually, marked complete, or deleted. Supports due dates.

### Templates (`/templates`)
4 predefined templates (SOAP Note, Discharge Summary, Referral Letter, Prescription). Doctors can create custom templates. Templates use `[PLACEHOLDER]` syntax for AI fill-in.

### Reports
Generated per encounter. Doctor picks a template → GPT-4o fills it with encounter data → editable rich text → downloadable as PDF (via WeasyPrint + MinIO).

### Settings (`/settings`)
Update doctor profile: name, phone, specialization.

### Admin (`/admin/doctors`) — Super Admin only
Create doctor accounts, activate/deactivate, reset passwords.

---

## Architecture: Audio Pipeline

```
Browser (MediaRecorder)
  → WebSocket binary chunks
    → FastAPI /ws/session/{encounter_id}
      → AudioProcessor (asyncio.Queue)
        → Deepgram WebSocket (nova-2-medical, diarize=true)
          ← interim transcript  →  broadcast TRANSCRIPT_INTERIM to browser
          ← final transcript    →  save TranscriptSegment to MongoDB
                                →  broadcast TRANSCRIPT_FINAL to browser
        → 30s periodic task     →  GPT-4o partial analysis
                                →  broadcast PARTIAL_ANALYSIS to browser
  → FINISH signal
    → asyncio.gather([summary, vitals, prescriptions, tasks])
    → save all to MongoDB
    → broadcast FINAL_ANALYSIS to browser
```

---

## Project Structure

```
Sribe/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point, lifespan, routers
│   │   ├── config.py            # pydantic-settings (reads .env)
│   │   ├── database.py          # Motor + Beanie init
│   │   ├── dependencies.py      # get_current_user, require_role
│   │   ├── models/              # Beanie Documents (MongoDB ODM)
│   │   ├── routers/             # FastAPI route handlers
│   │   ├── services/            # Business logic, LLM calls, audio processing
│   │   └── core/                # JWT/bcrypt, WebSocket manager, exceptions
│   ├── scripts/
│   │   ├── seed_templates.py    # Seeds 4 predefined templates on startup
│   │   └── seed_admin.py        # Seeds demo doctor + admin accounts
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   ├── components/          # UI components (scribe, layout, etc.)
│   │   └── lib/
│   │       ├── api/             # Typed fetch wrappers per module
│   │       ├── store/           # Zustand stores (auth, encounter, ui)
│   │       ├── websocket/       # AudioRecorder + WSClient
│   │       └── types/           # Shared TypeScript types
│   └── .env.local
├── docker-compose.yml
├── Makefile
└── DEV.md
```

---

## Makefile Commands

| Command | Description |
|---|---|
| `make dev` | Start MongoDB + MinIO via Docker |
| `make backend` | Start backend dev server (port 8000) |
| `make frontend` | Start frontend dev server (port 3000) |
| `make install` | Install all dependencies (pip + npm) |
| `make stop` | Stop Docker services |
| `make clean` | Stop Docker and delete all volumes |
| `make up` | Start all services including backend + frontend in Docker |
