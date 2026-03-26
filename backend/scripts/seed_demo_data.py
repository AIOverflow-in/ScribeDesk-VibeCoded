"""Seed demo patients and custom templates for the test doctor account."""

DEMO_PATIENTS = [
    {"name": "Aidan Patel",      "age": 34, "gender": "male",   "phone": "+1 415 555 0101", "email": "aidan.patel@example.com"},
    {"name": "Sophia Nguyen",    "age": 28, "gender": "female",  "phone": "+1 415 555 0102", "email": "sophia.nguyen@example.com"},
    {"name": "Marcus Thompson",  "age": 52, "gender": "male",   "phone": "+1 415 555 0103", "email": "marcus.t@example.com"},
    {"name": "Priya Sharma",     "age": 41, "gender": "female",  "phone": "+1 415 555 0104", "email": "priya.sharma@example.com"},
    {"name": "James O'Brien",    "age": 67, "gender": "male",   "phone": "+1 415 555 0105", "email": "jobrien@example.com"},
    {"name": "Layla Hassan",     "age": 23, "gender": "female",  "phone": "+1 415 555 0106", "email": "layla.h@example.com"},
    {"name": "Robert Kim",       "age": 45, "gender": "male",   "phone": "+1 415 555 0107", "email": "robert.kim@example.com"},
    {"name": "Fatima Al-Rashid", "age": 38, "gender": "female",  "phone": "+1 415 555 0108", "email": "fatima.r@example.com"},
]

DEMO_TEMPLATES = [
    {
        "name": "Quick Follow-Up",
        "type": "CUSTOM",
        "content": """Follow-Up Visit Note

Date: [DATE]
Patient: [PATIENT_NAME]

Reason for Visit:
[REASON_FOR_VISIT]

Interval History:
[INTERVAL_HISTORY]

Current Medications:
[CURRENT_MEDICATIONS]

Examination:
[EXAMINATION_FINDINGS]

Assessment & Plan:
[ASSESSMENT_AND_PLAN]

Follow-up in: [FOLLOW_UP_TIMEFRAME]
""",
    },
    {
        "name": "Pediatric Visit",
        "type": "CUSTOM",
        "content": """Pediatric Consultation Note

Patient: [PATIENT_NAME]  Age: [AGE]  DOB: [DOB]
Parent/Guardian: [GUARDIAN_NAME]

Chief Complaint:
[CHIEF_COMPLAINT]

Growth & Development:
- Weight: [WEIGHT]  Height: [HEIGHT]  Head Circumference: [HEAD_CIRCUMFERENCE]
- Developmental milestones: [DEVELOPMENTAL_MILESTONES]

Immunisation Status:
[IMMUNISATION_STATUS]

History of Present Illness:
[HISTORY_OF_PRESENT_ILLNESS]

Examination:
[PHYSICAL_EXAMINATION]

Impression:
[IMPRESSION]

Plan:
[PLAN]

Parent Education:
[PARENT_EDUCATION]
""",
    },
    {
        "name": "Mental Health Assessment",
        "type": "CUSTOM",
        "content": """Mental Health Assessment

Patient: [PATIENT_NAME]   Date: [DATE]

Presenting Concerns:
[PRESENTING_CONCERNS]

Mental Status Exam:
- Appearance & Behaviour: [APPEARANCE]
- Mood & Affect: [MOOD_AFFECT]
- Thought Process: [THOUGHT_PROCESS]
- Perception: [PERCEPTION]
- Cognition: [COGNITION]
- Insight & Judgement: [INSIGHT_JUDGEMENT]

Risk Assessment:
- Suicidal ideation: [SUICIDAL_IDEATION]
- Self-harm: [SELF_HARM]
- Risk to others: [RISK_TO_OTHERS]

Psychiatric History:
[PSYCHIATRIC_HISTORY]

Current Medications:
[CURRENT_MEDICATIONS]

Diagnosis (DSM-5):
[DIAGNOSIS]

Treatment Plan:
[TREATMENT_PLAN]

Next Appointment: [NEXT_APPOINTMENT]
""",
    },
    {
        "name": "Chronic Disease Review",
        "type": "CUSTOM",
        "content": """Chronic Disease Management Review

Patient: [PATIENT_NAME]   Condition: [CHRONIC_CONDITION]   Date: [DATE]

Disease Control:
[DISEASE_CONTROL_STATUS]

Recent Investigations:
[RECENT_INVESTIGATIONS]

Complications Screening:
[COMPLICATIONS_SCREENING]

Current Medications & Adherence:
[MEDICATIONS_ADHERENCE]

Lifestyle Factors:
- Diet: [DIET]
- Exercise: [EXERCISE]
- Smoking/Alcohol: [SMOKING_ALCOHOL]

Goals Review:
[GOALS_REVIEW]

Plan & Adjustments:
[PLAN_ADJUSTMENTS]

Referrals:
[REFERRALS]

Review in: [REVIEW_TIMEFRAME]
""",
    },
]


async def seed():
    from app.models.doctor import Doctor
    from app.models.patient import Patient
    from app.models.template import Template

    doctor = await Doctor.find_one(Doctor.email == "doctor@scribe.ai")
    if not doctor:
        return  # Demo doctor not seeded yet — skip

    # Seed patients
    existing_count = await Patient.find(Patient.doctor_id == doctor.id).count()
    if existing_count == 0:
        for p in DEMO_PATIENTS:
            patient = Patient(doctor_id=doctor.id, **p)
            await patient.insert()
        print(f"✅ Seeded {len(DEMO_PATIENTS)} demo patients")

    # Seed custom templates
    existing_custom = await Template.find(
        Template.doctor_id == doctor.id
    ).count()
    if existing_custom == 0:
        for t in DEMO_TEMPLATES:
            tmpl = Template(doctor_id=doctor.id, is_predefined=False, **t)
            await tmpl.insert()
        print(f"✅ Seeded {len(DEMO_TEMPLATES)} demo templates")
