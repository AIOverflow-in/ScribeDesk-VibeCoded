"""Seed predefined clinical templates. Run once at startup."""

PREDEFINED_TEMPLATES = [
    {
        "name": "SOAP Note",
        "type": "SOAP",
        "is_predefined": True,
        "content": """<h2>SOAP Note</h2>
<h3>Subjective</h3>
<p><strong>Chief Complaint:</strong> [CHIEF_COMPLAINT]</p>
<p><strong>History of Present Illness:</strong> [HISTORY_OF_PRESENT_ILLNESS]</p>
<p><strong>Current Medications:</strong> [CURRENT_MEDICATIONS]</p>
<p><strong>Allergies:</strong> [ALLERGIES]</p>

<h3>Objective</h3>
<p><strong>Vital Signs:</strong></p>
<ul>
  <li>Blood Pressure: [BLOOD_PRESSURE]</li>
  <li>Heart Rate: [HEART_RATE]</li>
  <li>Temperature: [TEMPERATURE]</li>
  <li>SpO2: [SPO2]</li>
  <li>Weight: [WEIGHT]</li>
</ul>
<p><strong>Physical Examination:</strong> [PHYSICAL_EXAMINATION]</p>

<h3>Assessment</h3>
<p>[ASSESSMENT]</p>

<h3>Plan</h3>
<p>[PLAN]</p>
""",
    },
    {
        "name": "Discharge Summary",
        "type": "DISCHARGE",
        "is_predefined": True,
        "content": """<h2>Discharge Summary</h2>
<p><strong>Admission Date:</strong> [ADMISSION_DATE]</p>
<p><strong>Discharge Date:</strong> [DISCHARGE_DATE]</p>
<p><strong>Admitting Diagnosis:</strong> [ADMITTING_DIAGNOSIS]</p>
<p><strong>Discharge Diagnosis:</strong> [DISCHARGE_DIAGNOSIS]</p>

<h3>Hospital Course</h3>
<p>[HOSPITAL_COURSE]</p>

<h3>Procedures Performed</h3>
<p>[PROCEDURES]</p>

<h3>Discharge Medications</h3>
<p>[DISCHARGE_MEDICATIONS]</p>

<h3>Follow-up Instructions</h3>
<p>[FOLLOW_UP_INSTRUCTIONS]</p>

<h3>Activity Restrictions</h3>
<p>[ACTIVITY_RESTRICTIONS]</p>
""",
    },
    {
        "name": "Referral Letter",
        "type": "REFERRAL",
        "is_predefined": True,
        "content": """<h2>Referral Letter</h2>
<p>Dear [SPECIALIST_NAME],</p>
<p>I am referring [PATIENT_NAME], [PATIENT_AGE], for your evaluation and management.</p>

<h3>Reason for Referral</h3>
<p>[REFERRAL_REASON]</p>

<h3>Clinical Summary</h3>
<p>[CLINICAL_SUMMARY]</p>

<h3>Current Medications</h3>
<p>[CURRENT_MEDICATIONS]</p>

<h3>Relevant Investigations</h3>
<p>[INVESTIGATIONS]</p>

<p>Please see and advise. Thank you for your assistance.</p>
<p>Regards,<br><strong>Dr. [DOCTOR_NAME]</strong><br>[DOCTOR_SPECIALIZATION]</p>
""",
    },
    {
        "name": "Prescription",
        "type": "PRESCRIPTION",
        "is_predefined": True,
        "content": """<h2>Prescription</h2>
<p><strong>Date:</strong> [DATE]</p>
<p><strong>Patient:</strong> [PATIENT_NAME] | Age: [PATIENT_AGE] | Gender: [PATIENT_GENDER]</p>

<h3>Medications</h3>
<p>[MEDICATIONS_LIST]</p>

<h3>Instructions</h3>
<p>[GENERAL_INSTRUCTIONS]</p>

<p><strong>Follow-up:</strong> [FOLLOW_UP_DATE]</p>
<br>
<p><strong>Dr. [DOCTOR_NAME]</strong><br>[DOCTOR_SPECIALIZATION]</p>
""",
    },
]


async def seed():
    from app.models.template import Template
    count = await Template.find(Template.is_predefined == True).count()
    if count > 0:
        return  # Already seeded

    for tmpl_data in PREDEFINED_TEMPLATES:
        tmpl = Template(**tmpl_data)
        await tmpl.insert()
    print(f"✅ Seeded {len(PREDEFINED_TEMPLATES)} predefined templates")
