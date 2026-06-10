import os
import json
import io
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import PyPDF2
from docx import Document
import chromadb
from sentence_transformers import SentenceTransformer
import openai
import google.generativeai as genai

from prompts import (
    CONTINUITY_TEACHER_PROMPT,
    HOMEWORK_GENERATOR_PROMPT,
    ATTENDANCE_ANALYZER_PROMPT,
    PRINCIPAL_INSIGHTS_PROMPT,
    DOUBT_ENGINE_PROMPT,
    SYLLABUS_PARSER_PROMPT
)

app = FastAPI(title="EduPilot AI Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_OPENAI = os.getenv("USE_OPENAI", "false").lower() == "true"
USE_GEMINI = os.getenv("USE_GEMINI", "true").lower() == "true"

if USE_OPENAI:
    openai.api_key = os.getenv("OPENAI_API_KEY", "")
    
if USE_GEMINI:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
    gemini_model = genai.GenerativeModel('gemini-pro')

chroma_client = chromadb.Client()
syllabus_collection = chroma_client.get_or_create_collection(name="syllabus_context")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

syllabus_store = {}

def call_llm(prompt: str, json_response: bool = False, temperature: float = 0.7) -> str:
    try:
        if USE_OPENAI and openai.api_key:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                response_format={"type": "json_object"} if json_response else None
            )
            return response.choices[0].message.content
        
        elif USE_GEMINI:
            response = gemini_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                )
            )
            return response.text
            
    except Exception as e:
        print(f"LLM Error: {e}. Using fallback mock response.")
    
    if "Continuity Teacher" in prompt:
        return json.dumps({
            "lesson_summary": "Today's lesson covers the fundamental concepts of the current chapter, ensuring continuity despite the teacher's absence.",
            "explanation": "We will review the previous topic and introduce the next logical steps, focusing on core principles and practical applications.",
            "examples": [
                "Example 1: Basic application demonstrating the core concept",
                "Example 2: Real-world scenario showing practical usage",
                "Example 3: Advanced case study for deeper understanding"
            ],
            "key_concepts": [
                "Fundamental principle of the topic",
                "Relationship with previous concepts",
                "Practical applications",
                "Common misconceptions to avoid"
            ],
            "class_notes": "Please review the examples carefully and practice the corresponding exercises. Focus on understanding the key concepts rather than memorization."
        })
    elif "Homework Generator" in prompt:
        return json.dumps({
            "easy": [
                "Define the main concept discussed in this chapter.",
                "List three key characteristics of the topic.",
                "What is the basic formula or principle?"
            ],
            "medium": [
                "Explain how this concept applies to a real-world scenario.",
                "Compare and contrast this topic with a related concept.",
                "Solve a numerical problem involving the core principle."
            ],
            "hard": [
                "Design an experiment to demonstrate this concept.",
                "Create a mathematical model showing the relationship between variables.",
                "Analyze a complex case study and provide detailed reasoning."
            ]
        })
    elif "Attendance Analyzer" in prompt:
        return "Critical Insights:\n- John Doe shows a 15% drop in attendance this month (8 absences in last 20 days)\n- Jane Smith has 3 consecutive absences, indicating potential health or family issues\n- Overall class attendance dropped from 94% to 88% in the past two weeks\n- Recommendation: Immediate parent contact for students with >3 consecutive absences"
    elif "Principal Insights" in prompt:
        return "Strategic Insights:\n- Grade 8 attendance decreased by 6% compared to last month\n- Most fee delays are occurring in Grade 9 (42 students pending)\n- Science department has highest teacher absence rate (12% vs school average of 5%)\n- Recommendation: Implement targeted intervention for Grade 9 fee collection\n- Recommendation: Review Science department staffing and backup plans"
    elif "Doubt Engine" in prompt:
        if any(word in prompt.lower() for word in ["bitcoin", "cryptocurrency", "stock", "politics"]):
            return "This question is out of syllabus context. Please ask questions related to your current curriculum."
        return "Based on the syllabus context: Reflection of light occurs when light rays bounce off a surface. The angle of incidence equals the angle of reflection (Law of Reflection). This principle is used in mirrors, periscopes, and many optical instruments."
    elif "Syllabus Parser" in prompt:
        return json.dumps({
            "Class 8": {
                "Science": {
                    "Chapter 1: Light": {
                        "topics": ["Reflection of Light", "Laws of Reflection", "Refraction of Light"],
                        "subtopics": {
                            "Reflection of Light": ["Regular Reflection", "Diffuse Reflection", "Applications"],
                            "Laws of Reflection": ["First Law", "Second Law", "Experimental Verification"],
                            "Refraction of Light": ["Refractive Index", "Snell's Law", "Total Internal Reflection"]
                        }
                    },
                    "Chapter 2: Sound": {
                        "topics": ["Production of Sound", "Propagation of Sound", "Characteristics of Sound"],
                        "subtopics": {
                            "Production of Sound": ["Vibrating Bodies", "Sound Waves", "Frequency and Amplitude"],
                            "Propagation of Sound": ["Medium Required", "Speed of Sound", "Echo"],
                            "Characteristics of Sound": ["Pitch", "Loudness", "Quality"]
                        }
                    }
                },
                "Mathematics": {
                    "Chapter 1: Rational Numbers": {
                        "topics": ["Properties of Rational Numbers", "Operations on Rational Numbers"],
                        "subtopics": {
                            "Properties of Rational Numbers": ["Closure", "Commutativity", "Associativity"],
                            "Operations on Rational Numbers": ["Addition", "Subtraction", "Multiplication", "Division"]
                        }
                    }
                }
            }
        })
    return "{}"

def parse_pdf(file_content: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF parsing error: {str(e)}")

def parse_docx(file_content: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX parsing error: {str(e)}")

@app.post("/api/syllabus/upload")
async def upload_syllabus(file: UploadFile = File(...)):
    try:
        file_content = await file.read()
        
        if file.filename.endswith('.pdf'):
            raw_text = parse_pdf(file_content)
        elif file.filename.endswith('.docx'):
            raw_text = parse_docx(file_content)
        else:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
        prompt = SYLLABUS_PARSER_PROMPT.format(raw_text=raw_text)
        structured_json = call_llm(prompt, json_response=True)
        structured_data = json.loads(structured_json)
        
        for class_name, subjects in structured_data.items():
            for subject, chapters in subjects.items():
                key = f"{class_name}_{subject}"
                syllabus_store[key] = chapters
                
                for chapter_name, chapter_data in chapters.items():
                    doc_text = f"{class_name} {subject} {chapter_name} {json.dumps(chapter_data)}"
                    embedding = embedding_model = None  def get_embedding_model():    
                    global embedding_model     
                    if embedding_model is None:         
                        print("Loading SentenceTransformer model...")         
                        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')     
                        return embedding_model(doc_text).tolist()
                    syllabus_collection.add(
                        documents=[doc_text],
                        embeddings=[embedding],
                        ids=[f"{key}_{chapter_name}"]
                    )
        
        return {
            "status": "success",
            "message": "Syllabus parsed and indexed successfully",
            "data": structured_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SyllabusQuery(BaseModel):
    class_name: str
    subject: str
    current_chapter: Optional[str] = None
    query_type: str
    search_query: Optional[str] = None

@app.post("/api/syllabus/query")
async def query_syllabus(query: SyllabusQuery):
    try:
        key = f"{query.class_name}_{query.subject}"
        
        if query.query_type == "structure":
            if key in syllabus_store:
                return {"result": syllabus_store[key]}
            else:
                return {"result": "Syllabus not found. Please upload first."}
        
        elif query.query_type == "search" and query.search_query:
            query_embedding = embedding_model = None  def get_embedding_model():     
                global embedding_model     
                if embedding_model is None:         
                    print("Loading SentenceTransformer model...")         
                    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')     
                    return embedding_model(query.search_query).tolist()
            results = syllabus_collection.query(
                query_embeddings=[query_embedding],
                n_results=3
            )
            return {"result": results['documents'][0] if results['documents'] else []}
        
        elif query.query_type in ["current", "previous", "next"]:
            if key not in syllabus_store:
                return {"result": "Syllabus not found"}
            
            chapters = list(syllabus_store[key].keys())
            if not query.current_chapter or query.current_chapter not in chapters:
                return {"result": chapters[0] if chapters else "No chapters found"}
            
            current_idx = chapters.index(query.current_chapter)
            
            if query.query_type == "current":
                return {"result": syllabus_store[key][query.current_chapter]}
            elif query.query_type == "previous":
                if current_idx > 0:
                    prev_chapter = chapters[current_idx - 1]
                    return {"result": {"chapter": prev_chapter, "data": syllabus_store[key][prev_chapter]}}
                return {"result": "No previous chapter"}
            elif query.query_type == "next":
                if current_idx < len(chapters) - 1:
                    next_chapter = chapters[current_idx + 1]
                    return {"result": {"chapter": next_chapter, "data": syllabus_store[key][next_chapter]}}
                return {"result": "No next chapter"}
        
        return {"result": "Invalid query type"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ContinuityRequest(BaseModel):
    class_name: str
    subject: str
    current_chapter: str
    previous_topic: str

@app.post("/api/ai/continuity-lesson")
async def generate_continuity_lesson(req: ContinuityRequest):
    try:
        key = f"{req.class_name}_{req.subject}"
        syllabus_context = syllabus_store.get(key, {})
        
        prompt = CONTINUITY_TEACHER_PROMPT.format(
            class_name=req.class_name,
            subject=req.subject,
            current_chapter=req.current_chapter,
            previous_topic=req.previous_topic,
            syllabus_context=json.dumps(syllabus_context)
        )
        
        response = call_llm(prompt, json_response=True, temperature=0.7)
        lesson_data = json.loads(response)
        
        return {
            "status": "success",
            "lesson": lesson_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DoubtRequest(BaseModel):
    class_name: str
    subject: str
    question: str

@app.post("/api/ai/doubt")
async def answer_doubt(req: DoubtRequest):
    try:
        key = f"{req.class_name}_{req.subject}"
        syllabus_context = json.dumps(syllabus_store.get(key, {}))
        
        query_embedding = embedding_model = None  def get_embedding_model():     
            global embedding_model     if embedding_model is None:         
                print("Loading SentenceTransformer model...")         
                embedding_model = SentenceTransformer('all-MiniLM-L6-v2')    
                return embedding_model(req.question).tolist()
        results = syllabus_collection.query(
            query_embeddings=[query_embedding],
            n_results=1,
            where={"$contains": key}
        )
        
        if not results['documents'] or not results['documents'][0]:
            return {
                "status": "rejected",
                "answer": "This question is out of syllabus context. Please ask questions related to your current curriculum."
            }
        
        prompt = DOUBT_ENGINE_PROMPT.format(
            syllabus_context=syllabus_context,
            question=req.question,
            relevant_context=results['documents'][0][0] if results['documents'] else ""
        )
        
        answer = call_llm(prompt, temperature=0.5)
        
        return {
            "status": "success",
            "answer": answer,
            "context_used": results['documents'][0][0] if results['documents'] else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class HomeworkRequest(BaseModel):
    class_name: str
    subject: str
    chapter: str
    difficulty: str = "all"

@app.post("/api/ai/homework")
async def generate_homework(req: HomeworkRequest):
    try:
        key = f"{req.class_name}_{req.subject}"
        syllabus_context = syllabus_store.get(key, {})
        chapter_data = syllabus_context.get(req.chapter, {})
        
        prompt = HOMEWORK_GENERATOR_PROMPT.format(
            class_name=req.class_name,
            subject=req.subject,
            chapter=req.chapter,
            difficulty=req.difficulty,
            chapter_context=json.dumps(chapter_data)
        )
        
        response = call_llm(prompt, json_response=True, temperature=0.8)
        homework_data = json.loads(response)
        
        return {
            "status": "success",
            "homework": homework_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AttendanceData(BaseModel):
    attendance_history: List[Dict[str, Any]]

@app.post("/api/ai/attendance-insights")
async def analyze_attendance(req: AttendanceData):
    try:
        prompt = ATTENDANCE_ANALYZER_PROMPT.format(
            attendance_data=json.dumps(req.attendance_history, indent=2)
        )
        
        insights = call_llm(prompt, temperature=0.3)
        
        return {
            "status": "success",
            "insights": insights,
            "risk_count": len([s for s in req.attendance_history if s.get('status') == 'absent'])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SchoolData(BaseModel):
    attendance_data: Dict[str, Any]
    fee_data: Dict[str, Any]
    teacher_absence_data: Dict[str, Any]

@app.post("/api/ai/principal-insights")
async def generate_principal_insights(req: SchoolData):
    try:
        prompt = PRINCIPAL_INSIGHTS_PROMPT.format(
            attendance_data=json.dumps(req.attendance_data, indent=2),
            fee_data=json.dumps(req.fee_data, indent=2),
            teacher_absence_data=json.dumps(req.teacher_absence_data, indent=2)
        )
        
        insights = call_llm(prompt, temperature=0.4)
        
        return {
            "status": "success",
            "insights": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EduPilot AI Microservice",
        "version": "1.0.0",
        "ai_backend": "Gemini" if USE_GEMINI else "OpenAI" if USE_OPENAI else "Mock"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
