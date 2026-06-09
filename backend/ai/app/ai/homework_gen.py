import json
import re
from datetime import date

from app.ai.gemini_client import ask_gemini_json
from app.ai.prompts import homework_generator_prompt
from app.core.database import get_db


# ─────────────────────────────────────────────
#  Phase 5 — Homework Generator
# ─────────────────────────────────────────────

async def generate_homework(class_name: str, subject: str, chapter: str) -> dict:
    """
    Generates AI-powered homework for a given class, subject, and chapter.
    Homework is divided into Easy, Medium, and Hard difficulty levels.

    Args:
        class_name: e.g. "8"
        subject:    e.g. "Science"
        chapter:    e.g. "Light Reflection"

    Returns:
        Dict containing homework questions by difficulty level
    """
    # Step 1: Generate homework via AI
    prompt = homework_generator_prompt(class_name, subject, chapter)
    result = await ask_gemini_json(prompt)

    # Step 2: Parse AI response
    try:
        clean    = re.sub(r"```json|```", "", result).strip()
        homework = json.loads(clean)
    except Exception:
        homework = {
            "easy":   [],
            "medium": [],
            "hard":   [],
            "raw":    result,
        }

    # Step 3: Save to MongoDB
    db     = get_db()
    record = {
        "class_name":         class_name,
        "subject":            subject,
        "chapter":            chapter,
        "generated_homework": homework,
        "assigned_date":      str(date.today()),
    }
    await db.homework.insert_one(record)

    return homework


# ─────────────────────────────────────────────
#  Homework Retrieval
# ─────────────────────────────────────────────

async def get_homework(class_name: str, subject: str) -> list:
    """
    Retrieves the 5 most recent homework assignments
    for a given class and subject.

    Args:
        class_name: e.g. "8"
        subject:    e.g. "Science"

    Returns:
        List of homework records sorted by date (latest first)
    """
    db     = get_db()
    cursor = db.homework.find(
        {"class_name": class_name, "subject": subject},
        {"_id": 0}
    ).sort("assigned_date", -1).limit(5)

    return await cursor.to_list(length=5)