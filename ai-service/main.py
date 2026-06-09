import os
import os
import json
import io
from typing import List, Dict, Any, Optional
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

import requests
import json

import requests
import json

def call_llm(prompt: str, json_response: bool = False, temperature: float = 0.7):
    # Teri Groq key yahan daal di hai
    API_KEY = None
    
    url = "https://api.groq.com/openai/v1/chat/completions"

    # Groq mein agar JSON output chahiye toh prompt mein 'json' likhna zaroori hota hai
    if json_response and "json" not in prompt.lower():
        prompt += "\n\nPlease provide the output strictly in valid JSON format."
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        # Ye naya model 128,000 tokens (poori PDF kitaab) ek baar mein padh sakta hai!
        "model": "llama-3.1-8b-instant", 
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature
    }

    # API ko batana zaroori hai ki hume result strictly JSON mein chahiye
    if json_response:
        payload["response_format"] = {"type": "json_object"}
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        # Agar ab Groq API fail hoti hai, toh terminal mein uski exact wajah print hogi!
        if response.status_code != 200:
            print(f"\n❌ Groq API Error Detail: {response.text}\n")
            response.raise_for_status()
            
        data = response.json()
        return data['choices'][0]['message']['content']
        
    except Exception as e:
        print(f"Groq LLM Error: {e}. Using fallback mock response.")
        
        if "Continuity Teacher" in prompt:
            return json.dumps({
                "lesson_summary": "Today's lesson covers the fundamental concepts of the current chapter, ensuring continuity despite the teacher's absence.",
                "explanation": "We will review the previous topic and introduce the next logical steps, focusing on core principles and practical examples.",
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
                "class_notes": "Please review the examples carefully and practice the corresponding exercises."
            })
        elif "Homework Generator" in prompt:
            return json.dumps({
                "easy": ["Define the main concept discussed in this chapter."],
                "medium": ["Explain how this concept applies to a real-world scenario."],
                "hard": ["Design an experiment to demonstrate this concept."]
            })
        else:
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
                    embedding = embedding_model.encode(doc_text).tolist()
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
            query_embedding = embedding_model.encode(query.search_query).tolist()
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
        
        query_embedding = embedding_model.encode(req.question).tolist()
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

