from datetime import date

from fastapi import APIRouter

from app.ai.attendance_intel import get_attendance_analytics, mark_attendance
from app.core.database import get_db
from app.models.models import MarkAttendanceRequest


# ─────────────────────────────────────────────
#  Attendance Router
# ─────────────────────────────────────────────

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/mark", summary="Mark Attendance")
async def mark_attendance_api(request: MarkAttendanceRequest) -> dict:
    """
    Marks attendance for students and/or teachers.
    Automatically triggers absence handlers and notifications.

    Request Body:
        date:    Attendance date e.g. "2026-06-05"
        records: List of [{id, type, status}]
    """
    return await mark_attendance(request.records, request.date)


@router.get("/analytics", summary="Attendance Analytics")
async def attendance_analytics(
    class_name: str = None,
    days: int = 30
) -> dict:
    """
    Returns AI-powered attendance analytics.

    Query Params:
        class_name: Optional — filter by class
        days:       Analysis period in days (default: 30)
    """
    return await get_attendance_analytics(class_name, days)


@router.get("/today/{class_name}", summary="Today's Attendance")
async def today_attendance(class_name: str) -> dict:
    """
    Returns today's attendance status for all students in a class.

    Path Params:
        class_name: e.g. "8"
    """
    db    = get_db()
    today = str(date.today())

    # Fetch all students in the class
    students = await db.students.find(
        {"class_name": class_name},
        {"_id": 0}
    ).to_list(100)

    # Match each student with today's attendance record
    records = []
    for student in students:
        att = await db.attendance.find_one({
            "date":       today,
            "student_id": student["student_id"],
        })
        records.append({
            "student_id": student["student_id"],
            "name":       student["name"],
            "status":     att["status"] if att else "not_marked",
        })

    return {
        "date":    today,
        "class":   class_name,
        "records": records,
    }


@router.get("/alerts", summary="Attendance Alerts")
async def get_alerts() -> list:
    """
    Returns the 20 most recent attendance alerts
    for the principal dashboard.
    """
    db = get_db()
    return await db.alerts.find(
        {},
        {"_id": 0}
    ).sort("_id", -1).limit(20).to_list(20)