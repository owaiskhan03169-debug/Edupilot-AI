from fastapi import APIRouter, HTTPException, UploadFile, File
from app.ai.continuity_teacher import start_ai_continuity_class, handle_student_doubt, end_ai_class
from app.ai.syllabus_engine import parse_syllabus_pdf_text, save_syllabus, get_current_chapter
from app.ai.principal_insights import get_live_school_status, generate_principal_insights, get_ai_activity_log
import PyPDF2, io

router = APIRouter(prefix="/ai", tags=["AI Workflow"])

@router.post("/syllabus/upload")
async def upload_syllabus(
    class_name: str,
    subject: str,
    file: UploadFile = File(...)
):
    content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    raw_text = ""
    for page in pdf_reader.pages:
        raw_text += page.extract_text() or ""

    if not raw_text.strip():
        raise HTTPException(400, "PDF text could not be extracted.")

    structured = await parse_syllabus_pdf_text(raw_text, class_name, subject)
    await save_syllabus(class_name, subject, structured)

    return {
        "status": "Syllabus uploaded and indexed",
        "class": class_name,
        "subject": subject,
        "chapters_found": len(structured.get("chapters", []))
    }

@router.get("/syllabus/{class_name}/{subject}")
async def get_syllabus_context(class_name: str, subject: str):
    return await get_current_chapter(class_name, subject)

@router.post("/continuity/start")
async def start_continuity(class_name: str, subject: str, teacher_id: str):
    return await start_ai_continuity_class(class_name, subject, teacher_id)

@router.post("/continuity/doubt")
async def ask_doubt(question: str, class_name: str, subject: str, session_id: str):
    return await handle_student_doubt(question, class_name, subject, session_id)

@router.post("/continuity/end/{session_id}")
async def end_class(session_id: str):
    return await end_ai_class(session_id)

@router.get("/dashboard/live")
async def live_dashboard():
    return await get_live_school_status()

@router.get("/dashboard/insights")
async def principal_insights():
    return await generate_principal_insights()

@router.get("/dashboard/activity-log")
async def activity_log():
    return await get_ai_activity_log()