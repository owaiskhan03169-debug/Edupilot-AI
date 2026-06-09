from fastapi import APIRouter

from app.ai.homework_gen import generate_homework, get_homework


# ─────────────────────────────────────────────
#  Homework Router
# ─────────────────────────────────────────────

router = APIRouter(prefix="/homework", tags=["Homework"])


@router.post("/generate", summary="Generate Homework")
async def generate_homework_api(
    class_name: str,
    subject:    str,
    chapter:    str,
) -> dict:
    """
    Generates AI-powered homework for a given class, subject, and chapter.
    Questions are divided into Easy, Medium, and Hard difficulty levels.

    Query Params:
        class_name: e.g. "8"
        subject:    e.g. "Science"
        chapter:    e.g. "Light Reflection"
    """
    result = await generate_homework(class_name, subject, chapter)

    return {
        "class":    class_name,
        "subject":  subject,
        "chapter":  chapter,
        "homework": result,
    }


@router.get("/{class_name}/{subject}", summary="Get Homework")
async def get_homework_api(
    class_name: str,
    subject:    str,
) -> list:
    """
    Retrieves the 5 most recent homework assignments
    for a given class and subject.

    Path Params:
        class_name: e.g. "8"
        subject:    e.g. "Science"
    """
    return await get_homework(class_name, subject)