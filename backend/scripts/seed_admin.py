"""Seed a default super admin and test doctor account."""


async def seed():
    from app.models.doctor import Doctor
    from app.core.security import hash_password

    # Super admin
    admin_email = "admin@scribe.ai"
    if not await Doctor.find_one(Doctor.email == admin_email):
        admin = Doctor(
            name="Super Admin",
            email=admin_email,
            password_hash=hash_password("admin123"),
            role="SUPER_ADMIN",
        )
        await admin.insert()
        print(f"✅ Created super admin: {admin_email} / admin123")

    # Test doctor
    doctor_email = "doctor@scribe.ai"
    if not await Doctor.find_one(Doctor.email == doctor_email):
        doctor = Doctor(
            name="Dr. Jane Smith",
            email=doctor_email,
            password_hash=hash_password("doctor123"),
            role="DOCTOR",
            specialization="General Physician",
        )
        await doctor.insert()
        print(f"✅ Created test doctor: {doctor_email} / doctor123")
