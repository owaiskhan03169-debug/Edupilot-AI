import json
import re
from datetime import date
from bson import ObjectId

from app.ai.gemini_client import ask_gemini_json
from app.ai.prompts import continuity_teacher_prompt, doubt_engine_prompt
from app.ai.syllabus_engine import get_current_chapter
from app.core.database import get_db


# ─────────────────────────────────────────────
#  Phase 3 — AI Continuity Teacher (Hero Module)
# ─────────────────────────────────────────────

async def start_ai_continuity_class(class_name: str, subject: str, teacher_id: str) -> dict:
    """
    Starts an AI-powered continuity class when a teacher is absent.

    Steps:
        1. Fetch current chapter context from syllabus
        2. Load teacher notes if available
        3. Generate full lesson via Gemini AI
        4. Save session to MongoDB
        5. Update attendance record with AI continuity flag

    Args:
        class_name: e.g. "8"
        subject:    e.g. "Science"
        teacher_id: ID of the absent teacher

    Returns:
        Session details with generated lesson data
    """
    db = get_db()

    # Step 1: Fetch syllabus context
    chapter_context = await get_current_chapter(class_name, subject)
    if "error" in chapter_context:
        return {"error": f"Syllabus not configured for Class {class_name} — {subject}"}

    current_chapter  = chapter_context.get("current_chapter", {})
    previous_chapter = chapter_context.get("previous_chapter", {})

    chapter_title  = current_chapter.get("title", "Unknown Chapter")
    previous_topic = previous_chapter.get("title", "First chapter") if previous_chapter else "First chapter"

    # Step 2: Load teacher notes
    teacher_record = await db.teachers.find_one({"teacher_id": teacher_id})
    notes = teacher_record.get("class_notes", "") if teacher_record else ""

    # Step 3: Generate lesson via AI
    prompt = continuity_teacher_prompt(class_name, subject, chapter_title, previous_topic, notes)
    result = await ask_gemini_json(prompt)

    try:
        clean       = re.sub(r"```json|```", "", result).strip()
        lesson_data = json.loads(clean)
    except Exception:
        lesson_data = {"explanation": result}

    # Step 4: Save session to MongoDB
    session = {
        "class_name": class_name,
        "subject":    subject,
        "chapter":    chapter_title,
        "lesson":     lesson_data,
        "status":     "active",
        "teacher_id": teacher_id,
        "ai_active":  True,
    }
    inserted   = await db.ai_sessions.insert_one(session)
    session_id = str(inserted.inserted_id)

    # Step 5: Mark AI continuity in attendance
    await db.attendance.update_one(
        {"date": str(date.today()), "class_name": class_name, "subject": subject},
        {"$set": {"ai_continuity_active": True, "session_id": session_id}},
        upsert=True,
    )

    return {
        "session_id": session_id,
        "class_name": class_name,
        "subject":    subject,
        "chapter":    chapter_title,
        "lesson":     lesson_data,
        "message":    f"✅ AI Continuity Class started for Class {class_name} — {subject}",
    }


# ─────────────────────────────────────────────
#  Phase 4 — Doubt Engine
# ─────────────────────────────────────────────

async def handle_student_doubt(question: str, class_name: str, subject: str, session_id: str) -> dict:
    """
    Handles student doubts during an AI continuity class.
    Only answers syllabus-related questions — rejects off-topic queries.

    Args:
        question:   Student's question
        class_name: e.g. "8"
        subject:    e.g. "Science"
        session_id: Active session ID from MongoDB

    Returns:
        AI response with syllabus relevance flag
    """
    db = get_db()

    # Fetch active session to get chapter context
    session = await db.ai_sessions.find_one({"_id": ObjectId(session_id)})
    chapter = session.get("chapter", "") if session else ""

    prompt = doubt_engine_prompt(question, class_name, subject, chapter)
    result = await ask_gemini_json(prompt)

    try:
        clean = re.sub(r"```json|```", "", result).strip()
        return json.loads(clean)
    except Exception:
        return {"is_syllabus_related": True, "answer": result}


# ─────────────────────────────────────────────
#  Phase 3 — End AI Class
# ─────────────────────────────────────────────

async def end_ai_class(session_id: str) -> dict:
    """
    Ends an active AI continuity class.
    Automatically generates homework and updates session status.

    Args:
        session_id: Active session ID from MongoDB

    Returns:
        Summary with chapter covered and generated homework
    """
    from app.ai.homework_gen import generate_homework

    db      = get_db()
    session = await db.ai_sessions.find_one({"_id": ObjectId(session_id)})

    if not session:
        return {"error": "Session not found"}

    # Generate homework for the covered chapter
    homework = await generate_homework(
        session["class_name"],
        session["subject"],
        session["chapter"],
    )

    # Mark session as completed
    await db.ai_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"status": "completed", "homework_generated": homework}},
    )

    return {
        "status":          "Class ended successfully",
        "session_id":      session_id,
        "chapter_covered": session["chapter"],
        "homework":        homework,
    }