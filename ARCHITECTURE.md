# Scribe — Backend Architecture

How audio becomes a clinical summary, from mic to MongoDB.

---

## The Big Picture

```
Doctor speaks
     │
     ▼
Browser (MediaRecorder)
     │  WebM/Opus audio chunks (~250ms each)
     ▼
FastAPI WebSocket  (/ws/session/{encounter_id})
     │
     ├──► Deepgram Cloud (real-time STT)
     │         │
     │         ├── interim transcript → browser (live display)
     │         └── final transcript  → MongoDB + browser
     │
     └──► Every 30s: GPT-4o partial analysis → browser
     │
  [Doctor clicks Finish]
     │
     ▼
GPT-4o (4 parallel calls)
     │
     ├── Clinical Summary (SOAP)
     ├── Vitals extraction
     ├── Prescription suggestions
     └── Follow-up tasks
          │
          ▼
     MongoDB  +  FINAL_ANALYSIS → browser
```

---

## Phase 1 — Session Start

When the doctor selects a patient and clicks **Start Recording**:

1. **Frontend** calls `POST /encounters/start` → creates an `Encounter` document in MongoDB with status `ACTIVE`.
2. **Frontend** opens a WebSocket to `/ws/session/{encounter_id}?token=<jwt>`.
3. **Backend** authenticates the JWT from the query param (WebSocket can't send headers), looks up the doctor, and accepts the connection.
4. An `AudioProcessor` instance is created for this encounter and `.start()` is called, which opens a WebSocket connection to Deepgram.
5. Backend sends `CONNECTED` message back to the browser.

---

## Phase 2 — Live Audio → Transcript

```
Browser                    FastAPI                     Deepgram
  │                           │                            │
  │── binary audio chunk ────►│── forward chunk ──────────►│
  │── binary audio chunk ────►│── forward chunk ──────────►│
  │                           │◄── interim: "blood press..." │
  │◄── TRANSCRIPT_INTERIM ────│                            │
  │                           │◄── final: "Blood pressure  │
  │                           │    is 120 over 80."        │
  │                           │    [save to MongoDB]       │
  │◄── TRANSCRIPT_FINAL ──────│                            │
```

**Audio flow:**
- Browser `MediaRecorder` captures WebM/Opus audio in ~250ms chunks and sends them as binary WebSocket frames.
- FastAPI receives each chunk and puts it into an `asyncio.Queue`.
- A background task (`_proxy_audio`) drains the queue and forwards each chunk to Deepgram over a separate WebSocket.
- Deepgram returns two types of results:
  - **Interim** — partial recognition, fires frequently while speaking. Sent to browser as `TRANSCRIPT_INTERIM` for the live "listening..." display. Not saved.
  - **Final** — confirmed utterance after 300ms of silence. Saved to MongoDB as a `TranscriptSegment` and sent to browser as `TRANSCRIPT_FINAL`.

**Deepgram config used:**
```
model: nova-2-medical   → medical vocabulary (drug names, conditions)
diarize: true           → speaker detection
punctuate: true         → auto punctuation
interim_results: true   → word-by-word live display
endpointing: 300        → 300ms silence = end of utterance
smart_format: true      → formats numbers, dates, medications
```

**What gets saved per segment:**
```python
TranscriptSegment(
    encounter_id = "...",
    speaker      = "SPEAKER_0",   # from Deepgram diarization
    text         = "Blood pressure is 120 over 80.",
    start_time   = 12.4,          # seconds from session start
    end_time     = 15.1,
)
```

The `Encounter.transcript_text` field is also updated incrementally:
```
SPEAKER_0: How long have you had this pain?
SPEAKER_1: About two days now, mostly around my belly button.
SPEAKER_0: Any fever or nausea?
```
This accumulated text is what gets passed to GPT-4o later.

---

## Phase 3 — Partial Analysis (every 30s)

While recording, a background task (`_periodic_analysis`) wakes up every 30 seconds and sends the last 50 transcript segments to GPT-4o:

```python
prompt: "Analyze this partial clinical transcript..."

response: {
  "key_points": ["Patient reports 2-day abdominal pain"],
  "symptoms": ["periumbilical pain", "no fever"],
  "possible_diagnoses": ["gastritis", "indigestion"],
  "items_to_clarify": ["bowel movements", "onset after eating?"]
}
```

This is sent to the browser as `PARTIAL_ANALYSIS` and updates the Clinical Summary panel in real-time. It is **not** saved to MongoDB — it's a live hint for the doctor.

The same analysis also triggers immediately when the doctor clicks **Pause**.

---

## Phase 4 — Finish & Full Analysis

When the doctor clicks **Finish**:

1. Frontend sends `FINISH` control message over WebSocket.
2. Frontend calls `POST /encounters/{id}/finish` → sets encounter status to `FINISHED`.
3. Backend stops the Deepgram connection and drains remaining audio.
4. `run_full_analysis()` is launched as an async background task.

**4 GPT-4o calls run in parallel** (`asyncio.gather`) with a 90s timeout:

```
transcript_text
      │
      ├──► clinical_summary_prompt  →  SOAP note (chief complaint, HPI,
      │                                exam, assessment, plan, diagnoses)
      │
      ├──► vitals_extraction_prompt →  BP, HR, Temp, Weight, Height, SpO2
      │
      ├──► prescription_prompt      →  medications (name, dosage,
      │                                frequency, duration, instructions)
      │
      └──► task_extraction_prompt   →  follow-up tasks with due dates
```

Each result is saved to MongoDB independently:
- `ClinicalSummary` document (with embedded `Vitals`)
- `Prescription` document (with embedded `Medication` list)
- One `Task` document per extracted task

Then `FINAL_ANALYSIS` is sent to the browser with all four results in a single payload. The browser updates the UI and disconnects from the WebSocket.

---

## Phase 5 — Loading Past Encounters

When a doctor opens `/scribe/{id}`:

`GET /encounters/{id}/detail` fetches from MongoDB in one go:
- The `Encounter` document
- The `ClinicalSummary` (one per encounter)
- The `Prescription` (one per encounter)
- All `TranscriptSegments` sorted by `start_time`

Everything was already saved during the session — no re-analysis needed.

---

## Data Models (MongoDB Collections)

| Collection | Purpose |
|---|---|
| `encounters` | One per session. Holds status, `transcript_text`, start/end times. |
| `transcript_segments` | One row per Deepgram final utterance. Indexed by `encounter_id`. |
| `clinical_summaries` | SOAP summary + vitals. One per encounter. |
| `prescriptions` | Medication list. One per encounter. |
| `tasks` | Follow-up tasks extracted from transcript. Many per encounter. |

---

## WebSocket Message Reference

| Direction | Message type | When |
|---|---|---|
| → Browser | `CONNECTED` | Session accepted |
| → Browser | `TRANSCRIPT_INTERIM` | Word being spoken (not saved) |
| → Browser | `TRANSCRIPT_FINAL` | Utterance confirmed, saved to DB |
| → Browser | `PARTIAL_ANALYSIS` | Every 30s GPT-4o update |
| → Browser | `PROCESSING_STARTED` | Full analysis kicked off |
| → Browser | `FINISHING` | Acknowledged finish command |
| → Browser | `FINAL_ANALYSIS` | All 4 LLM results ready |
| → Browser | `ERROR` | Any failure |
| ← Browser | binary bytes | Audio chunk |
| ← Browser | `{"type":"PAUSE"}` | Doctor paused |
| ← Browser | `{"type":"RESUME"}` | Doctor resumed |
| ← Browser | `{"type":"FINISH"}` | Doctor finished session |

---

## Key Design Decisions

**Why WebSocket for audio instead of HTTP uploads?**
Streaming over WebSocket gives sub-second transcript latency. HTTP batch uploads would mean waiting until the end to get any text.

**Why Deepgram instead of Whisper?**
Deepgram processes audio in real-time and returns words as they're spoken. Whisper is batch-only — you send a complete audio file and wait. For a live scribe, real-time is essential.

**Why 4 parallel LLM calls instead of one big prompt?**
Each task (summary, vitals, prescriptions, tasks) has a focused, structured output. A single prompt asking for everything at once tends to produce inconsistent JSON. Parallel calls are also faster (all 4 finish in ~20-30s total vs ~40-60s sequential) and any one failure doesn't block the others.

**Why store `transcript_text` on the Encounter in addition to segments?**
Segments require a database query and a join to reconstruct. Having `transcript_text` directly on the Encounter lets the LLM pipeline read one document instead of fetching and sorting potentially hundreds of segments.
