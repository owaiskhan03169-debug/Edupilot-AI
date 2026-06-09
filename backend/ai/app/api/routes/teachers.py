from fastapi import APIRouter, HTTPException
from app.core.database import get_db
from app.models.models import Teacher


# ─────────────────────────────────────────────
#  Teachers Router
# ─────────────────────────────────────────────

router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.post("/add", summary="Add Teacher")
async def add_teacher(teacher: Teacher) -> dict:
    """
    Adds a new teacher to the database.
    """
    db = get_db()

    # Check if teacher already exists
    existing = await db.teachers.find_one({"teacher_id": teacher.teacher_id})
    if existing:
        raise HTTPException(status_code=400, detail="Teacher ID already exists")

    await db.teachers.insert_one(teacher.model_dump())
    return {"status": "added", "teacher_id": teacher.teacher_id}


@router.get("/all", summary="Get All Teachers")
async def get_all_teachers() -> list:
    """
    Returns all teachers in the database.
    """
    db       = get_db()
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(200)
    return teachers


@router.get("/{teacher_id}", summary="Get Teacher")
async def get_teacher(teacher_id: str) -> dict:
    """
    Returns a single teacher by ID.
    """
    db      = get_db()
    teacher = await db.teachers.find_one(
        {"teacher_id": teacher_id},
        {"_id": 0}
    )
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@router.delete("/{teacher_id}", summary="Delete Teacher")
async def delete_teacher(teacher_id: str) -> dict:
    """
    Deletes a teacher by ID.
    """
    db = get_db()
    await db.teachers.delete_one({"teacher_id": teacher_id})
    return {"status": "deleted", "teacher_id": teacher_id}


@router.post("/bulk-add", summary="Bulk Add Teachers")
async def bulk_add_teachers(teachers: list[Teacher]) -> dict:
    """
    Adds multiple teachers at once.
    """
    db   = get_db()
    docs = [t.model_dump() for t in teachers]
    await db.teachers.insert_many(docs)
    return {"status": "added", "count": len(docs)}


@router.put("/{teacher_id}/attendance", summary="Update Teacher Attendance Status")
async def update_teacher_attendance(teacher_id: str, status: str) -> dict:
    """
    Updates a teacher's attendance status.

    Query Params:
        status: "present" or "absent"
    """
    db = get_db()
    await db.teachers.update_one(
        {"teacher_id": teacher_id},
        {"$set": {"attendance_status": status}}
    )
    return {"status": "updated", "teacher_id": teacher_id, "attendance_status": status}