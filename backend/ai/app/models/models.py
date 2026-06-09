from pydantic import BaseModel
from typing import Optional, List

# ─── Student ────────────────────────────────────────────
class Student(BaseModel):
    student_id: str
    name: str
    class_name: str
    section: str
    parent_contact: str
    attendance_percentage: float = 100.0
    fee_status: str = "unpaid"

# ─── Teacher ────────────────────────────────────────────
class Teacher(BaseModel):
    teacher_id: str
    name: str
    subject: str
    assigned_classes: List[str]
    attendance_status: str = "present"

# ─── Attendance ─────────────────────────────────────────
class AttendanceRecord(BaseModel):
    date: str
    student_id: Optional[str] = None
    teacher_id: Optional[str] = None
    status: str
    ai_continuity_active: bool = False

class MarkAttendanceRequest(BaseModel):
    date: str
    records: List[dict]

# ─── Fees ───────────────────────────────────────────────
class FeeRecord(BaseModel):
    student_id: str
    amount: float
    payment_status: str = "unpaid"
    due_date: str
    grace_period_days: int = 5
    reminder_history: List[str] = []

# ─── Homework ───────────────────────────────────────────
class HomeworkRecord(BaseModel):
    class_name: str
    subject: str
    chapter: str
    generated_homework: dict
    assigned_date: str