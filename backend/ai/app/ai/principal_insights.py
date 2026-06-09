import json
import re
from datetime import date, timedelta

from app.ai.gemini_client import ask_gemini_json
from app.ai.prompts import principal_insights_prompt
from app.core.database import get_db


# ─────────────────────────────────────────────
#  Phase 7 — Live School Status
# ─────────────────────────────────────────────

async def get_live_school_status() -> dict:
    """
    Retrieves real-time school operational status for the principal dashboard.

    Returns:
        Dict with absent teachers, active AI classes,
        student attendance counts, pending fees, and alerts
    """
    db    = get_db()
    today = str(date.today())

    # Fetch absent teachers
    absent_teachers = await db.attendance.find(
        {"date": today, "status": "absent", "teacher_id": {"$exists": True}},
        {"_id": 0, "teacher_id": 1}
    ).to_list(100)

    # Count active AI continuity sessions
    active_ai = await db.ai_sessions.count_documents({"status": "active"})

    # Count student attendance
    present_students = await db.attendance.count_documents(
        {"date": today, "status": "present", "student_id": {"$exists": True}}
    )
    absent_students = await db.attendance.count_documents(
        {"date": today, "status": "absent", "student_id": {"$exists": True}}
    )

    # Count pending fee payments
    pending_fees = await db.fees.count_documents({"payment_status": "unpaid"})

    # Fetch today's alerts
    alerts = await db.alerts.find(
        {"date": today}, {"_id": 0}
    ).to_list(20)

    return {
        "date":                 today,
        "absent_teachers":      [t["teacher_id"] for t in absent_teachers],
        "absent_teacher_count": len(absent_teachers),
        "active_ai_classes":    active_ai,
        "present_students":     present_students,
        "absent_students":      absent_students,
        "pending_fees":         pending_fees,
        "alerts":               alerts,
    }


# ─────────────────────────────────────────────
#  Phase 7 — AI Principal Insights
# ─────────────────────────────────────────────

async def generate_principal_insights() -> dict:
    """
    Generates AI-powered insights for the principal dashboard
    based on last 30 days of attendance, fee, and teacher data.

    Returns:
        Dict with summaries and AI-generated insights
    """
    db      = get_db()
    last_30 = str(date.today() - timedelta(days=30))

    # Attendance summary
    total_att  = await db.attendance.count_documents(
        {"date": {"$gte": last_30}, "student_id": {"$exists": True}}
    )
    absent_att = await db.attendance.count_documents(
        {"date": {"$gte": last_30}, "status": "absent", "student_id": {"$exists": True}}
    )
    att_summary = f"Total: {total_att}, Absent: {absent_att}, Period: 30 days"

    # Fee summary
    total_fees  = await db.fees.count_documents({})
    unpaid_fees = await db.fees.count_documents({"payment_status": "unpaid"})
    fee_summary = f"Total students: {total_fees}, Unpaid: {unpaid_fees}"

    # Teacher absence summary
    teacher_absent  = await db.attendance.count_documents(
        {"date": {"$gte": last_30}, "status": "absent", "teacher_id": {"$exists": True}}
    )
    teacher_summary = f"Teacher absences last 30 days: {teacher_absent}"

    # Generate AI insights
    prompt = principal_insights_prompt(att_summary, fee_summary, teacher_summary)
    result = await ask_gemini_json(prompt)

    try:
        clean    = re.sub(r"```json|```", "", result).strip()
        insights = json.loads(clean)
    except Exception:
        insights = {"insights": [result]}

    return {
        "generated_at":       str(date.today()),
        "attendance_summary": {"total": total_att,  "absent": absent_att},
        "fee_summary":        {"total": total_fees, "unpaid": unpaid_fees},
        "teacher_summary":    {"absences": teacher_absent},
        "ai_insights":        insights,
    }


# ─────────────────────────────────────────────
#  Phase 7 — AI Activity Log
# ─────────────────────────────────────────────

async def get_ai_activity_log() -> list:
    """
    Retrieves the 20 most recent AI continuity class sessions
    for the principal's activity log.

    Returns:
        List of session records sorted by latest first
    """
    db       = get_db()
    sessions = await db.ai_sessions.find(
        {},
        {
            "_id":        0,
            "class_name": 1,
            "subject":    1,
            "chapter":    1,
            "status":     1,
            "teacher_id": 1,
        }
    ).sort("_id", -1).limit(20).to_list(20)

    return sessions