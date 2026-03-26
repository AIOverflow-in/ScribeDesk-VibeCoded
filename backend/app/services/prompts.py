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


def clinical_summary_messages(transcript: str, specialization: str = "General Physician", template_content: str | None = None) -> list[dict]:
    if template_content:
        format_instruction = f"""Format the note using the following template structure as a guide:

TEMPLATE:
{template_content}

Fill in each section of the template with the relevant clinical information from the transcript."""
    else:
        format_instruction = "Generate a structured SOAP clinical summary."

    return [
        {"role": "system", "content": SYSTEM_BASE + f"\nDoctor specialization: {specialization}"},
        {"role": "user", "content": f"""{format_instruction}

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
        {"role": "user", "content": f"""Extract medications that were prescribed or discussed in this clinical encounter.

CLINICAL SUMMARY:
{summary}

TRANSCRIPT:
{transcript}

Rules:
- Only include medications explicitly mentioned or strongly indicated in the encounter.
- For "name": include the drug name with form if stated (e.g. "Amoxicillin 500mg capsule", "Ibuprofen 400mg tablet").
- For "dosage": the strength or dose (e.g. "500mg", "10mg/5ml"). Use empty string "" if not mentioned.
- For "frequency": how often taken (e.g. "Twice daily", "Every 8 hours", "Once at bedtime"). Use empty string "" if not mentioned.
- For "duration": how long to take it (e.g. "7 days", "2 weeks", "Ongoing"). Use empty string "" if not mentioned.
- For "instructions": special instructions (e.g. "Take with food", "Avoid alcohol"). Use null if none.
- IMPORTANT: Never output the word "null" for dosage, frequency, or duration — use empty string "" instead.

Output JSON with this exact structure:
{{
  "medications": [
    {{
      "name": "string",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "instructions": null,
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
    history: list[dict] | None = None,
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

    system_msg = {
        "role": "system",
        "content": (
            "You are a clinical AI assistant helping a doctor during a patient consultation. "
            "Answer the doctor's questions based strictly on the provided context. "
            "If information is not in the context, clearly say so. "
            "Be concise and clinically accurate. Respond in plain text — do not use JSON.\n\n"
            f"CONTEXT:\n{context}"
        ),
    }

    messages = [system_msg]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": question})
    return messages
