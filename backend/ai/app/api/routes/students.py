from fastapi import APIRouter, HTTPException
from app.core.database import get_db
from app.models.models import Student


# ─────────────────────────────────────────────
#  Students Router
# ─────────────────────────────────────────────

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("/add", summary="Add Student")
async def add_student(student: Student) -> dict:
    """
    Adds a new student to the database.
    """
    db = get_db()

    # Check if student already exists
    existing = await db.students.find_one({"student_id": student.student_id})
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")

    await db.students.insert_one(student.model_dump())
    return {"status": "added", "student_id": student.student_id}


@router.get("/all", summary="Get All Students")
async def get_all_students() -> list:
    """
    Returns all students in the database.
    """
    db       = get_db()
    students = await db.students.find({}, {"_id": 0}).to_list(500)
    return students


@router.get("/{student_id}", summary="Get Student")
async def get_student(student_id: str) -> dict:
    """
    Returns a single student by ID.
    """
    db      = get_db()
    student = await db.students.find_one(
        {"student_id": student_id},
        {"_id": 0}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.delete("/{student_id}", summary="Delete Student")
async def delete_student(student_id: str) -> dict:
    """
    Deletes a student by ID.
    """
    db = get_db()
    await db.students.delete_one({"student_id": student_id})
    return {"status": "deleted", "student_id": student_id}


@router.post("/bulk-add", summary="Bulk Add Students")
async def bulk_add_students(students: list[Student]) -> dict:
    """
    Adds multiple students at once.
    """
    db   = get_db()
    docs = [s.model_dump() for s in students]
    await db.students.insert_many(docs)
    return {"status": "added", "count": len(docs)}