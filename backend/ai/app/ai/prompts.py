def continuity_teacher_prompt(class_name: str, subject: str, chapter: str, previous_topic: str, notes: str = "") -> str:
    return f"""
You are an experienced school teacher teaching {subject} to Class {class_name} students.

Today's chapter: {chapter}
Previous topic: {previous_topic}
Teacher notes: {notes if notes else "No extra notes"}

Generate a complete class lesson that includes:
1. LESSON SUMMARY (2-3 sentences)
2. EXPLANATION (detailed, simple English/Urdu mix)
3. REAL-LIFE EXAMPLES (at least 2)
4. KEY CONCEPTS (bullet points)
5. CLASS NOTES (to write on the board)

Return in JSON format:
{{
  "lesson_summary": "...",
  "explanation": "...",
  "examples": ["...", "..."],
  "key_concepts": ["...", "..."],
  "class_notes": "..."
}}
"""

def doubt_engine_prompt(question: str, class_name: str, subject: str, chapter: str) -> str:
    return f"""
You are a school AI teacher. Answer only within the syllabus.

Student question: {question}
Class: {class_name}
Subject: {subject}
Chapter: {chapter}

Rules:
- If the question is related to the syllabus → explain clearly
- If the question is OUTSIDE the syllabus → politely reject it
- Answer should be bilingual (Urdu + English)

Return JSON:
{{
  "is_syllabus_related": true,
  "answer": "...",
  "rejection_message": "..."
}}
"""

def homework_generator_prompt(class_name: str, subject: str, chapter: str) -> str:
    return f"""
Generate homework for Class {class_name} for the subject {subject} from chapter {chapter}.

Create questions in 3 difficulty levels:
- Easy: basic recall questions (3 questions)
- Medium: understanding questions (3 questions)
- Hard: application/critical thinking questions (2 questions)

Return JSON:
{{
  "easy": ["Q1...", "Q2...", "Q3..."],
  "medium": ["Q1...", "Q2...", "Q3..."],
  "hard": ["Q1...", "Q2..."]
}}
"""

def attendance_analyzer_prompt(attendance_data: str) -> str:
    return f"""
Analyze the school attendance data and provide insights:

{attendance_data}

Return JSON:
{{
  "risky_students": ["student_id1"],
  "insights": ["insight1", "insight2"],
  "recommendations": ["recommendation1"]
}}
"""

def principal_insights_prompt(attendance_summary: str, fee_summary: str, teacher_summary: str) -> str:
    return f"""
Generate a daily school summary for the principal.

Attendance Data: {attendance_summary}
Fee Data: {fee_summary}
Teacher Data: {teacher_summary}

Return JSON:
{{
  "attendance_insights": ["..."],
  "fee_insights": ["..."],
  "teacher_insights": ["..."],
  "risk_alerts": ["..."],
  "overall_status": "good"
}}
"""

def fee_reminder_message(student_name: str, amount: float, due_date: str, days_overdue: int) -> str:
    return f"""
Generate a respectful fee reminder for parents.

Student: {student_name}
Amount Due: Rs. {amount}
Due Date: {due_date}
Days Overdue: {days_overdue}

Return JSON:
{{
  "english_message": "..."
}}
"""