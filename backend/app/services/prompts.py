"""All LLM prompt construction functions. Never inline prompts elsewhere."""

SYSTEM_BASE = """You are a clinical AI assistant helping a doctor during a patient consultation.
Extract medical information accurately and output ONLY valid JSON when asked for structured data.
Do not add commentary outside the JSON structure."""


def partial_analysis_messages(segments: list[str], specialization: str = "General Physician") -> list[dict]:
    transcript = "\n".join(segments)
    return [
        {"role": "system", "content": SYSTEM_BASE + f"\nDoctor specialization: {specialization}"},
        {"role": "user", "content": f"""Analyze this partial clinical conversation transcript and extract key information so far.

TRANSCRIPT:
{transcript}

Output JSON with this exact structure:
{{
  "key_points": ["string"],
  "symptoms": ["string"],
  "possible_diagnoses": ["string"],
  "items_to_clarify": ["string"]
}}"""},
    ]


def clinical_summary_messages(transcript: str, specialization: str = "General Physician") -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_BASE + f"\nDoctor specialization: {specialization}"},
        {"role": "user", "content": f"""Generate a structured SOAP clinical summary from this encounter transcript.

TRANSCRIPT:
{transcript}

Output JSON with this exact structure:
{{
  "chief_complaint": "string",
  "history_of_present_illness": "string",
  "physical_examination": "string or null",
  "assessment": "string",
  "plan": "string",
  "summary_text": "brief 2-3 sentence overall summary",
  "diagnosis": ["string"]
}}"""},
    ]


def vitals_extraction_messages(transcript: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Extract any vital signs mentioned in this clinical transcript.

TRANSCRIPT:
{transcript}

Output JSON with this exact structure (use null for any vital not mentioned):
{{
  "blood_pressure": "string or null",
  "heart_rate": "string or null",
  "temperature": "string or null",
  "weight": "string or null",
  "height": "string or null",
  "spo2": "string or null",
  "respiratory_rate": "string or null"
}}"""},
    ]


def prescription_messages(transcript: str, summary: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Extract medications mentioned or prescribed in this clinical encounter.

CLINICAL SUMMARY:
{summary}

TRANSCRIPT:
{transcript}

Output JSON with this exact structure:
{{
  "medications": [
    {{
      "name": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string or null",
      "is_suggested": true
    }}
  ]
}}"""},
    ]


def task_extraction_messages(transcript: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Extract follow-up tasks, referrals, or actions the doctor mentioned in this transcript.

TRANSCRIPT:
{transcript}

Output JSON with this exact structure:
{{
  "tasks": [
    {{
      "title": "string",
      "description": "string or null",
      "due_in_days": 7
    }}
  ]
}}"""},
    ]


def speaker_classification_messages(labeled_transcript: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Analyze this clinical conversation transcript where each line is labeled with a speaker ID.
Determine which speaker ID corresponds to the Doctor and which corresponds to the Patient.

TRANSCRIPT:
{labeled_transcript}

Instructions:
- The Doctor typically asks diagnostic questions, uses medical terminology, gives instructions, and mentions medications or examinations.
- The Patient typically describes symptoms, answers questions, and uses lay terms.
- If there is only one speaker ID detected, make your best guess based on content.
- Output the role for each unique speaker ID found.

Output JSON with this exact structure:
{{
  "speaker_roles": {{
    "SPEAKER_0": "Doctor" | "Patient" | "Unknown",
    "SPEAKER_1": "Doctor" | "Patient" | "Unknown"
  }},
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation"
}}"""},
    ]


def report_fill_messages(template_content: str, summary: str, vitals: str, medications: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Fill in this clinical report template using the patient's encounter data.

CLINICAL SUMMARY:
{summary}

VITALS:
{vitals}

MEDICATIONS:
{medications}

TEMPLATE:
{template_content}

Return the completed report as HTML. Fill in all placeholders with actual clinical data.
Keep the same structure as the template but replace all [PLACEHOLDER] markers with real data."""},
    ]


def chat_messages(
    patient_info: str,
    transcript: str,
    summary: str,
    prescriptions: str,
    past_summaries: str,
    question: str,
) -> list[dict]:
    context = f"""PATIENT INFORMATION:
{patient_info}

CURRENT ENCOUNTER TRANSCRIPT:
{transcript[:3000]}

CLINICAL SUMMARY:
{summary}

CURRENT PRESCRIPTIONS:
{prescriptions}

PAST ENCOUNTER SUMMARIES:
{past_summaries}"""

    return [
        {"role": "system", "content": f"""{SYSTEM_BASE}
You are reviewing a patient's clinical encounter. Answer the doctor's questions based strictly on the provided context.
If information is not in the context, clearly say so. Be concise and clinically accurate."""},
        {"role": "user", "content": f"CONTEXT:\n{context}\n\nDOCTOR'S QUESTION:\n{question}"},
    ]
