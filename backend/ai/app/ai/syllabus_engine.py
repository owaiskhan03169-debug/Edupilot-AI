import json
import re
from typing import Optional
from app.ai.gemini_client import ask_gemini_json
from app.core.database import get_db


# ─────────────────────────────────────────────
#  Phase 1 — Syllabus Understanding Engine
# ─────────────────────────────────────────────

async def parse_syllabus_pdf_text(raw_text: str, class_name: str, subject: str) -> dict:
    """
    Converts raw syllabus PDF text into a structured JSON format using AI.
    
    Args:
        raw_text: Extracted text from syllabus PDF
        class_name: e.g. "8"
        subject: e.g. "Science"
    
    Returns:
        Structured syllabus dict with chapters and teaching sequence
    """
    prompt = f"""
Convert this syllabus text into a clean structured JSON format.

Class: {class_name}
Subject: {subject}
Raw Syllabus Text:
{raw_text}

Return JSON:
{{
  "class_name": "{class_name}",
  "subject": "{subject}",
  "chapters": [
    {{
      "chapter_number": 1,
      "title": "Chapter Title",
      "topics": ["topic1", "topic2"],
      "subtopics": ["subtopic1"]
    }}
  ],
  "teaching_sequence": ["Chapter 1 title", "Chapter 2 title"]
}}
"""
    result = await ask_gemini_json(prompt)
    try:
        clean = re.sub(r"```json|```", "", result).strip()
        return json.loads(clean)
    except Exception:
        return {"error": "Failed to parse syllabus", "raw": result}


# ─────────────────────────────────────────────
#  Phase 1 — Save Syllabus to MongoDB
# ─────────────────────────────────────────────

async def save_syllabus(class_name: str, subject: str, structured_data: dict) -> dict:
    """
    Saves or updates structured syllabus data in MongoDB.
    
    Args:
        class_name: e.g. "8"
        subject: e.g. "Science"
        structured_data: Parsed syllabus JSON from AI
    
    Returns:
        Status confirmation dict
    """
    db = get_db()
    await db.syllabus.update_one(
        {"class_name": class_name, "subject": subject},
        {"$set": structured_data},
        upsert=True
    )
    return {"status": "saved"}


# ─────────────────────────────────────────────
#  Phase 2 — Syllabus Context Retrieval
# ─────────────────────────────────────────────

async def get_current_chapter(class_name: str, subject: str) -> dict:
    """
    Retrieves current, previous, and next chapter context
    based on class progress stored in MongoDB.
    
    Args:
        class_name: e.g. "8"
        subject: e.g. "Science"
    
    Returns:
        Dict with current, previous, next chapter info and progress %
    """
    db = get_db()

    # Fetch syllabus from DB
    syllabus = await db.syllabus.find_one(
        {"class_name": class_name, "subject": subject},
        {"_id": 0}
    )
    if not syllabus:
        return {"error": "Syllabus not found for this class and subject"}

    # Fetch current progress
    progress = await db.progress.find_one(
        {"class_name": class_name, "subject": subject}
    )

    chapters = syllabus.get("chapters", [])
    current_idx = progress.get("current_chapter_index", 0) if progress else 0

    return {
        "current_chapter":  chapters[current_idx] if current_idx < len(chapters) else None,
        "previous_chapter": chapters[current_idx - 1] if current_idx > 0 else None,
        "next_chapter":     chapters[current_idx + 1] if current_idx + 1 < len(chapters) else None,
        "total_chapters":   len(chapters),
        "progress_percentage": round((current_idx / len(chapters)) * 100, 1) if chapters else 0
    }


# ─────────────────────────────────────────────
#  Phase 2 — Advance to Next Chapter
# ─────────────────────────────────────────────

async def advance_chapter(class_name: str, subject: str) -> dict:
    """
    Moves class progress to the next chapter after completion.
    
    Args:
        class_name: e.g. "8"
        subject: e.g. "Science"
    
    Returns:
        Status and new chapter index
    """
    db = get_db()
    progress = await db.progress.find_one(
        {"class_name": class_name, "subject": subject}
    )
    current_idx = progress.get("current_chapter_index", 0) if progress else 0

    await db.progress.update_one(
        {"class_name": class_name, "subject": subject},
        {"$set": {"current_chapter_index": current_idx + 1}},
        upsert=True
    )
    return {"status": "advanced", "new_index": current_idx + 1}