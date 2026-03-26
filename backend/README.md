# Scribe — Backend

FastAPI backend for the Scribe clinical AI scribe platform. Handles real-time audio transcription via Deepgram, AI-powered clinical analysis via OpenAI, file storage via MinIO, and a REST + WebSocket API consumed by the Next.js frontend.

## Tech Stack

| | |
|---|---|
| Framework | FastAPI + Uvicorn |
| Language | Python 3.12 |
| Database | MongoDB 7 via Motor (async) + Beanie ODM |
| Transcription | Deepgram `nova-2-medical` (real-time WebSocket, speaker diarization) |
| AI | OpenAI GPT-5.4 (final analysis) + GPT-5.4-mini (inline/partial analysis) |
| File Storage | MinIO (S3-compatible) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| PDF Generation | WeasyPrint |

## Prerequisites

- Python 3.12
- MongoDB 7 running on `localhost:27017`
- MinIO running on `localhost:9000`
- OpenAI API key
- Deepgram API key

The easiest way to get MongoDB and MinIO running is via Docker Compose from the repo root:
```bash
make dev
```

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # or create manually
```

`.env`:
```env
MONGODB_URL=mongodb://root:12345@localhost:27017/
MONGODB_DB_NAME=scribe

JWT_SECRET=change-this-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=2880

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4
OPENAI_MODEL_FAST=gpt-5.4-mini

DEEPGRAM_API_KEY=...

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=scribe-files

CORS_ORIGINS=http://localhost:3000
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

Or from the repo root:
```bash
make backend
```

On first start, the app seeds 4 default report templates and two demo accounts (doctor + admin).

## API

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Email + password login, returns access + refresh tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/users/me` | Current doctor profile |
| `PATCH` | `/users/me` | Update doctor profile |
| `POST` | `/encounters` | Create new encounter |
| `GET` | `/encounters` | List encounters for current doctor |
| `GET` | `/encounters/{id}` | Get encounter detail |
| `POST` | `/encounters/{id}/finish` | End recording, run final AI analysis |
| `POST` | `/encounters/{id}/regenerate-summary` | Re-run clinical summary (optionally with different template) |
| `POST` | `/encounters/{id}/prescription` | Generate prescription from encounter |
| `POST` | `/encounters/{id}/reports` | Generate a formatted report |
| `GET` | `/encounters/{id}/reports/{rid}/pdf` | Download report as PDF |
| `GET` | `/tasks` | List tasks |
| `PATCH` | `/tasks/{id}` | Update task (complete, due date, etc.) |
| `GET` | `/templates` | List note templates |
| `POST` | `/templates` | Create custom template |
| `WS` | `/ws/session/{encounter_id}` | Real-time audio + transcript WebSocket |

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, lifespan hooks, router registration
│   ├── config.py            # pydantic-settings — reads .env
│   ├── database.py          # Motor + Beanie init, index creation
│   ├── dependencies.py      # get_current_user(), require_role() FastAPI deps
│   │
│   ├── models/              # Beanie Documents (MongoDB collections)
│   │   ├── user.py          # Doctor / admin accounts
│   │   ├── encounter.py     # Encounter (patient session)
│   │   ├── transcript_segment.py
│   │   ├── clinical_summary.py
│   │   ├── medication.py
│   │   ├── task.py
│   │   ├── template.py
│   │   └── report.py
│   │
│   ├── routers/             # FastAPI route handlers
│   │   ├── auth.py          # Login, refresh
│   │   ├── users.py         # Profile management, admin CRUD
│   │   ├── encounters.py    # Encounter lifecycle + analysis endpoints
│   │   ├── tasks.py
│   │   ├── templates.py
│   │   ├── reports.py
│   │   └── websocket.py     # /ws/session/{id} handler
│   │
│   ├── services/
│   │   ├── audio_processor.py   # Per-session audio pipeline (Deepgram proxy + analysis)
│   │   ├── deepgram_client.py   # Deepgram WebSocket connection wrapper
│   │   ├── llm_service.py       # chat_completion(), parse_json_response()
│   │   ├── prompts.py           # All LLM prompt builders
│   │   ├── storage.py           # MinIO upload/download helpers
│   │   └── pdf_generator.py     # WeasyPrint HTML → PDF
│   │
│   └── core/
│       ├── security.py          # JWT encode/decode, bcrypt
│       ├── websocket_manager.py # ConnectionManager — per-encounter WS broadcast
│       └── exceptions.py        # Custom HTTP exception helpers
│
└── scripts/
    ├── seed_templates.py    # Idempotent — seeds 4 default report templates
    └── seed_admin.py        # Idempotent — seeds demo doctor + admin accounts
```

## Audio Pipeline

```
Browser (MediaRecorder 250ms chunks)
  → WebSocket binary frames → /ws/session/{encounter_id}
    → AudioProcessor.feed()
      → asyncio.Queue → _proxy_audio() → Deepgram WS
        ← interim transcript  →  TRANSCRIPT_INTERIM broadcast
        ← final transcript    →  save TranscriptSegment to MongoDB
                              →  TRANSCRIPT_FINAL broadcast
      → 30s periodic task     →  GPT-5.4-mini partial analysis
                              →  PARTIAL_ANALYSIS broadcast
  → FINISH signal
    → asyncio.gather([summary, vitals, prescriptions, tasks])  # all in parallel
    → persist to MongoDB
    → FINAL_ANALYSIS broadcast
```

**Model split strategy:**
- `OPENAI_MODEL_FAST` (`gpt-5.4-mini`) — `_run_partial_analysis()`, called every 30s during recording
- `OPENAI_MODEL` (`gpt-5.4`) — final SOAP summary, vitals extraction, prescription generation, report fill, AI chat

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Doctor | `doctor@scribe.ai` | `doctor123` |
| Super Admin | `admin@scribe.ai` | `admin123` |
