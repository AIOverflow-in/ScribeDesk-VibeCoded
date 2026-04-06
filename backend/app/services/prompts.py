"""All LLM prompt construction functions. Never inline prompts elsewhere."""

SYSTEM_BASE = """You are a clinical AI assistant helping a doctor during a patient consultation.
Extract medical information accurately and output ONLY valid JSON when asked for structured data.
Do not add commentary outside the JSON structure."""


def partial_analysis_messages(segments: list[str], specialization: str = "General Physician") -> list[dict]:
    transcript = "\n".join(segments)
    return [
        {"role": "system", "content": SYSTEM_BASE + f"\nDoctor specialization: {specialization}"},
        {"role": "user", "content": f"""Analyze this partial clinical conversation transcript. Extract key clinical information identified so far.

TRANSCRIPT:
{transcript}

Output JSON with this exact structure:
{{
  "key_points": ["string"],
  "symptoms": ["string"],
  "possible_diagnoses": ["string"],
  "items_to_clarify": ["string"],
  "differential_diagnoses": [
    {{"diagnosis": "string", "rationale": "brief 1-sentence rationale"}}
  ],
  "red_flags": ["string"],
  "suggested_workup": ["string"]
}}

For differential_diagnoses: list up to 3 most likely diagnoses with brief clinical rationale.
For red_flags: list any alarming symptoms or findings that warrant urgent attention.
For suggested_workup: list relevant investigations or tests to consider (e.g. "CBC", "chest X-ray").
Use empty arrays [] if not enough information yet."""},
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


def billing_extraction_messages(transcript: str, summary: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Extract ICD-10 diagnosis codes and CPT procedure codes from this clinical encounter.

CLINICAL SUMMARY:
{summary}

TRANSCRIPT:
{transcript}

Rules:
- Only include codes that are clearly supported by the encounter content.
- For ICD-10: use the most specific code available (e.g. "J18.9" not just "J18").
- For CPT: include common E&M codes (99213, 99214 etc.) and any procedure codes if mentioned.
- Confidence: "high" = explicitly stated, "medium" = strongly implied, "low" = possible but uncertain.

Output JSON with this exact structure:
{{
  "billing_codes": [
    {{
      "code": "string",
      "description": "string",
      "type": "ICD-10" or "CPT",
      "confidence": "high" | "medium" | "low"
    }}
  ]
}}"""},
    ]


def patient_summary_messages(transcript: str, summary: str, medications: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Write a plain-English after-visit summary for the PATIENT (not the doctor).

CLINICAL SUMMARY:
{summary}

TRANSCRIPT:
{transcript}

MEDICATIONS PRESCRIBED:
{medications}

Instructions:
- Use simple, non-technical language a patient can understand.
- Include: what was discussed, diagnosis in plain terms, medications with clear instructions, follow-up plan, warning signs to watch for.
- Keep it warm, clear, and reassuring.
- Format as flowing paragraphs (not clinical SOAP format).
- Maximum 250 words.

Output JSON:
{{
  "patient_summary": "plain English summary text"
}}"""},
    ]


def letter_generation_messages(
    letter_type: str,
    transcript: str,
    summary: str,
    medications: str,
    patient_name: str,
    patient_age: str,
    doctor_name: str,
    specialization: str,
    letterhead: str,
) -> list[dict]:
    type_instructions = {
        "referral": "Write a formal referral letter to a specialist. Include: reason for referral, relevant clinical history, current medications, specific clinical question or request. Address it 'Dear Colleague,'.",
        "sick_note": "Write a medical sick note / fit note. Include: patient name, diagnosis in simple terms, recommended rest period (estimate from context, e.g. 7-14 days), any work restrictions. Keep it brief and formal.",
        "patient_instructions": "Write a patient instructions letter. Include: medication schedule with clear instructions, lifestyle advice from the encounter, follow-up appointment timing, and when to seek urgent medical attention.",
    }
    instruction = type_instructions.get(letter_type, type_instructions["referral"])

    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""{instruction}

PATIENT: {patient_name}, Age: {patient_age}
DOCTOR: Dr. {doctor_name}, {specialization}
LETTERHEAD: {letterhead}

CLINICAL SUMMARY:
{summary}

TRANSCRIPT EXCERPT:
{transcript[:2000]}

MEDICATIONS:
{medications}

Output JSON:
{{
  "letter_html": "full letter as HTML with <p> tags, proper formatting. Include today's date at top."
}}"""},
    ]


def drug_interaction_messages(medications: list[str]) -> list[dict]:
    med_list = "\n".join(f"- {m}" for m in medications)
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Check for clinically significant drug interactions between these medications:

{med_list}

For each interaction pair found, provide:
- severity: "Minor" (monitor only), "Moderate" (may require dose adjustment), or "Major" (avoid combination / close monitoring essential)
- mechanism: brief pharmacological explanation
- management: what the doctor should do

Only include interactions that are clinically relevant and evidence-based.
If no significant interactions found, return an empty array.

Output JSON:
{{
  "interactions": [
    {{
      "drug_a": "string",
      "drug_b": "string",
      "severity": "Minor" | "Moderate" | "Major",
      "mechanism": "string",
      "management": "string"
    }}
  ]
}}"""},
    ]


def pre_visit_messages(
    patient_name: str,
    past_encounters: list[dict],
) -> list[dict]:
    encounter_text = ""
    for i, enc in enumerate(past_encounters[:5], 1):
        encounter_text += f"""
--- Visit {i} ({enc.get('date', 'Unknown date')}) ---
Chief Complaint: {enc.get('chief_complaint', 'N/A')}
Assessment: {enc.get('assessment', 'N/A')}
Plan: {enc.get('plan', 'N/A')}
Diagnoses: {', '.join(enc.get('diagnosis', []))}
Medications: {enc.get('medications', 'None recorded')}
"""
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Generate a pre-visit brief for an upcoming appointment with patient: {patient_name}

PAST ENCOUNTER HISTORY:
{encounter_text}

Create a concise brief that helps the doctor quickly prepare for this visit.

Output JSON:
{{
  "last_visit_summary": "1-2 sentence summary of most recent visit",
  "active_diagnoses": ["string"],
  "current_medications": ["string"],
  "pending_follow_ups": ["string"],
  "notable_flags": ["string"]
}}

Use empty arrays [] if no relevant data available."""},
    ]


def evidence_messages(diagnoses: list[str], specialization: str = "General Physician") -> list[dict]:
    diag_text = "\n".join(f"- {d}" for d in diagnoses)
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": f"""Based on these diagnoses, provide evidence-based clinical recommendations.

DIAGNOSES:
{diag_text}

DOCTOR SPECIALIZATION: {specialization}

Provide 2-4 evidence-based recommendations relevant to management, treatment, or monitoring.
Reference NICE guidelines, USPSTF, or major clinical guidelines where applicable.
Be concise and actionable.

Output JSON:
{{
  "evidence": [
    "Guideline recommendation with source (e.g. 'NICE CG192: Start ACE inhibitor for hypertension with CKD')"
  ]
}}"""},
    ]
