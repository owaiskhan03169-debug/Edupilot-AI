import json
import re
from datetime import date, timedelta

from app.ai.gemini_client import ask_gemini_json
from app.ai.prompts import attendance_analyzer_prompt
from app.core.database import get_db


# ─────────────────────────────────────────────
#  Phase 6 — Attendance Intelligence
# ─────────────────────────────────────────────

async def mark_attendance(records: list, date_str: str) -> dict:
    """
    Marks attendance for students and teachers.
    Automatically flags absences and triggers notifications.

    Args:
        records:  List of dicts — [{id, type, status}]
        date_str: Date string e.g. "2026-06-05"

    Returns:
        Status and count of saved records
    """
    db    = get_db()
    saved = []

    for rec in records:
        # Build attendance document
        doc = {
            "date":                 date_str,
            f"{rec['type']}_id":    rec["id"],
            "status":               rec["status"],
            "ai_continuity_active": False,
        }
        await db.attendance.insert_one(doc)
        saved.append(doc)

        # Trigger absence handlers
        if rec["type"] == "student" and rec["status"] == "absent":
            await flag_absent_student(rec["id"], date_str)

        if rec["type"] == "teacher" and rec["status"] == "absent":
            await flag_absent_teacher(rec["id"], date_str)

    return {"status": "saved", "count": len(saved)}


# ─────────────────────────────────────────────
#  Absent Student Handler
# ─────────────────────────────────────────────

async def flag_absent_student(student_id: str, date_str: str) -> None:
    """
    Flags an absent student by:
      - Queuing a parent notification
      - Raising a principal alert if absences >= 3 in last 7 days

    Args:
        student_id: Student's unique ID
        date_str:   Date of absence
    """
    db      = get_db()
    student = await db.students.find_one({"student_id": student_id})
    if not student:
        return

    # Queue parent notification
    await db.notification_queue.insert_one({
        "type":           "student_absent",
        "student_id":     student_id,
        "student_name":   student.get("name", ""),
        "parent_contact": student.get("parent_contact", ""),
        "date":           date_str,
        "status":         "pending",
    })

    # Check for repeated absences in last 7 days
    seven_days_ago = str(date.today() - timedelta(days=7))
    absences = await db.attendance.count_documents({
        "student_id": student_id,
        "status":     "absent",
        "date":       {"$gte": seven_days_ago},
    })

    # Raise principal alert if chronic absenteeism detected
    if absences >= 3:
        await db.alerts.insert_one({
            "type":          "repeated_absence",
            "student_id":    student_id,
            "student_name":  student.get("name", ""),
            "class_name":    student.get("class_name", ""),
            "absence_count": absences,
            "date":          date_str,
            "severity":      "warning",
        })


# ─────────────────────────────────────────────
#  Absent Teacher Handler
# ─────────────────────────────────────────────

async def flag_absent_teacher(teacher_id: str, date_str: str) -> None:
    """
    Flags an absent teacher by queuing AI continuity
    classes for all assigned classes.

    Args:
        teacher_id: Teacher's unique ID
        date_str:   Date of absence
    """
    db      = get_db()
    teacher = await db.teachers.find_one({"teacher_id": teacher_id})
    if not teacher:
        return

    # Queue AI continuity for each assigned class
    for class_name in teacher.get("assigned_classes", []):
        await db.continuity_queue.insert_one({
            "teacher_id": teacher_id,
            "subject":    teacher.get("subject", ""),
            "class_name": class_name,
            "date":       date_str,
            "status":     "pending",
        })


# ─────────────────────────────────────────────
#  Attendance Analytics
# ─────────────────────────────────────────────

async def get_attendance_analytics(class_name: str = None, days: int = 30) -> dict:
    """
    Generates AI-powered attendance analytics for a given period.

    Args:
        class_name: Optional filter by class
        days:       Number of days to analyze (default: 30)

    Returns:
        Dict with attendance stats and AI-generated insights
    """
    db         = get_db()
    start_date = str(date.today() - timedelta(days=days))

    # Build query
    query = {"date": {"$gte": start_date}}
    if class_name:
        students    = await db.students.find(
            {"class_name": class_name}, {"student_id": 1}
        ).to_list(100)
        student_ids = [s["student_id"] for s in students]
        query["student_id"] = {"$in": student_ids}

    # Fetch records
    records = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    total   = len(records)
    absent  = sum(1 for r in records if r.get("status") == "absent")
    present = total - absent

    # Generate AI insights
    summary   = f"Total: {total}, Present: {present}, Absent: {absent}, Period: Last {days} days"
    prompt    = attendance_analyzer_prompt(summary)
    ai_result = await ask_gemini_json(prompt)

    try:
        clean    = re.sub(r"```json|```", "", ai_result).strip()
        insights = json.loads(clean)
    except Exception:
        insights = {"insights": [ai_result]}

    return {
        "total_records":         total,
        "present":               present,
        "absent":                absent,
        "attendance_percentage": round((present / total * 100), 1) if total else 0,
        "ai_insights":           insights,
        "period_days":           days,
    }