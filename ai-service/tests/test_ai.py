"""
Phase 9: AI Testing Suite
Comprehensive automated tests for all EduPilot AI modules
"""

import pytest
import json
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

# Test Data
SAMPLE_SYLLABUS_DATA = {
    "Class 8": {
        "Science": {
            "Chapter 1: Light": {
                "topics": ["Reflection", "Refraction"],
                "subtopics": {
                    "Reflection": ["Laws of Reflection", "Types of Reflection"],
                    "Refraction": ["Refractive Index", "Snell's Law"]
                }
            }
        },
        "Mathematics": {
            "Chapter 1: Rational Numbers": {
                "topics": ["Properties", "Operations"],
                "subtopics": {
                    "Properties": ["Closure", "Commutativity"],
                    "Operations": ["Addition", "Multiplication"]
                }
            }
        }
    }
}

SAMPLE_ATTENDANCE_DATA = [
    {"student": "John Doe", "status": "absent", "consecutive": 3, "total_days": 20, "absent_days": 8},
    {"student": "Jane Smith", "status": "present", "consecutive": 0, "total_days": 20, "absent_days": 2},
    {"student": "Bob Wilson", "status": "absent", "consecutive": 5, "total_days": 20, "absent_days": 10}
]

SAMPLE_SCHOOL_DATA = {
    "attendance_data": {
        "Grade 8": {"total": 200, "present": 180, "percentage": 90},
        "Grade 9": {"total": 180, "present": 162, "percentage": 90},
        "Grade 10": {"total": 150, "present": 135, "percentage": 90}
    },
    "fee_data": {
        "total_due": 500000,
        "collected": 420000,
        "pending_students": 42,
        "grade_wise": {
            "Grade 8": 10,
            "Grade 9": 25,
            "Grade 10": 7
        }
    },
    "teacher_absence_data": {
        "Science": {"total": 10, "absent": 2, "percentage": 20},
        "Math": {"total": 8, "absent": 1, "percentage": 12.5},
        "English": {"total": 6, "absent": 0, "percentage": 0}
    }
}

# ============================================
# Phase 1 & 2: Syllabus Tests
# ============================================

def test_health_check():
    """Test API health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_syllabus_query_structure():
    """Test Phase 2: Syllabus structure query"""
    response = client.post("/api/syllabus/query", json={
        "class_name": "Class 8",
        "subject": "Science",
        "query_type": "structure"
    })
    assert response.status_code == 200
    data = response.json()
    assert "result" in data

def test_syllabus_query_navigation():
    """Test Phase 2: Chapter navigation queries"""
    # Test current chapter query
    response = client.post("/api/syllabus/query", json={
        "class_name": "Class 8",
        "subject": "Science",
        "current_chapter": "Chapter 1",
        "query_type": "current"
    })
    assert response.status_code == 200
    
    # Test next chapter query
    response = client.post("/api/syllabus/query", json={
        "class_name": "Class 8",
        "subject": "Science",
        "current_chapter": "Chapter 1",
        "query_type": "next"
    })
    assert response.status_code == 200

# ============================================
# Phase 3: AI Continuity Teacher Tests
# ============================================

def test_continuity_lesson_generation():
    """Test Phase 3: AI Continuity Teacher lesson generation"""
    response = client.post("/api/ai/continuity-lesson", json={
        "class_name": "Class 8",
        "subject": "Science",
        "current_chapter": "Chapter 1: Light",
        "previous_topic": "Introduction to Light"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "lesson" in data
    
    lesson = data["lesson"]
    assert "lesson_summary" in lesson
    assert "explanation" in lesson
    assert "examples" in lesson
    assert "key_concepts" in lesson
    assert "class_notes" in lesson
    
    # Validate content quality
    assert len(lesson["lesson_summary"]) > 50
    assert len(lesson["examples"]) >= 2
    assert len(lesson["key_concepts"]) >= 2

def test_continuity_lesson_different_subjects():
    """Test continuity teacher across different subjects"""
    subjects = ["Science", "Mathematics", "English"]
    
    for subject in subjects:
        response = client.post("/api/ai/continuity-lesson", json={
            "class_name": "Class 8",
            "subject": subject,
            "current_chapter": "Chapter 1",
            "previous_topic": "Previous Topic"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

# ============================================
# Phase 4: Doubt Engine Tests
# ============================================

def test_doubt_engine_valid_question():
    """Test Phase 4: Doubt engine with valid syllabus question"""
    response = client.post("/api/ai/doubt", json={
        "class_name": "Class 8",
        "subject": "Science",
        "question": "What is reflection of light?"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "out of syllabus" not in data["answer"].lower()

def test_doubt_engine_out_of_context():
    """Test Phase 4: Doubt engine rejects out-of-context questions"""
    out_of_context_questions = [
        "What is Bitcoin?",
        "Who will win the next election?",
        "How to invest in stocks?",
        "What is cryptocurrency mining?"
    ]
    
    for question in out_of_context_questions:
        response = client.post("/api/ai/doubt", json={
            "class_name": "Class 8",
            "subject": "Science",
            "question": question
        })
        
        assert response.status_code == 200
        data = response.json()
        # Should reject or indicate out of context
        assert "out of" in data["answer"].lower() or "context" in data["answer"].lower()

def test_doubt_engine_edge_cases():
    """Test doubt engine with edge cases"""
    # Empty question
    response = client.post("/api/ai/doubt", json={
        "class_name": "Class 8",
        "subject": "Science",
        "question": ""
    })
    assert response.status_code in [200, 422]  # Either handles or validation error
    
    # Very long question
    long_question = "What is " + "light " * 100 + "?"
    response = client.post("/api/ai/doubt", json={
        "class_name": "Class 8",
        "subject": "Science",
        "question": long_question
    })
    assert response.status_code == 200

# ============================================
# Phase 5: Homework Generator Tests
# ============================================

def test_homework_generation():
    """Test Phase 5: Homework generator"""
    response = client.post("/api/ai/homework", json={
        "class_name": "Class 8",
        "subject": "Science",
        "chapter": "Chapter 1: Light",
        "difficulty": "all"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "homework" in data
    
    homework = data["homework"]
    assert "easy" in homework
    assert "medium" in homework
    assert "hard" in homework
    
    # Validate question counts
    assert len(homework["easy"]) >= 1
    assert len(homework["medium"]) >= 1
    assert len(homework["hard"]) >= 1

def test_homework_difficulty_levels():
    """Test homework generation for specific difficulty levels"""
    difficulties = ["easy", "medium", "hard", "all"]
    
    for difficulty in difficulties:
        response = client.post("/api/ai/homework", json={
            "class_name": "Class 8",
            "subject": "Mathematics",
            "chapter": "Chapter 1",
            "difficulty": difficulty
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

def test_homework_json_format():
    """Test that homework is returned in strict JSON format"""
    response = client.post("/api/ai/homework", json={
        "class_name": "Class 8",
        "subject": "Science",
        "chapter": "Chapter 1",
        "difficulty": "all"
    })
    
    assert response.status_code == 200
    data = response.json()
    homework = data["homework"]
    
    # Ensure it's valid JSON structure
    assert isinstance(homework, dict)
    assert isinstance(homework.get("easy"), list)
    assert isinstance(homework.get("medium"), list)
    assert isinstance(homework.get("hard"), list)

# ============================================
# Phase 6: Attendance Intelligence Tests
# ============================================

def test_attendance_analysis():
    """Test Phase 6: Attendance intelligence analyzer"""
    response = client.post("/api/ai/attendance-insights", json={
        "attendance_history": SAMPLE_ATTENDANCE_DATA
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "insights" in data
    assert len(data["insights"]) > 50  # Should have substantial insights

def test_attendance_risk_identification():
    """Test that attendance analyzer identifies risky students"""
    response = client.post("/api/ai/attendance-insights", json={
        "attendance_history": SAMPLE_ATTENDANCE_DATA
    })
    
    assert response.status_code == 200
    data = response.json()
    insights = data["insights"].lower()
    
    # Should mention high-risk students
    assert "john doe" in insights or "bob wilson" in insights
    assert "absent" in insights or "risk" in insights

def test_attendance_empty_data():
    """Test attendance analyzer with empty data"""
    response = client.post("/api/ai/attendance-insights", json={
        "attendance_history": []
    })
    
    assert response.status_code == 200

# ============================================
# Phase 7: Principal Insights Tests
# ============================================

def test_principal_insights_generation():
    """Test Phase 7: Principal insights generator"""
    response = client.post("/api/ai/principal-insights", json=SAMPLE_SCHOOL_DATA)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "insights" in data
    assert len(data["insights"]) > 100  # Should have comprehensive insights

def test_principal_insights_content():
    """Test that principal insights contain key information"""
    response = client.post("/api/ai/principal-insights", json=SAMPLE_SCHOOL_DATA)
    
    assert response.status_code == 200
    data = response.json()
    insights = data["insights"].lower()
    
    # Should mention key metrics
    assert "grade" in insights or "attendance" in insights
    assert "fee" in insights or "delay" in insights
    assert any(dept in insights for dept in ["science", "math", "english"])

def test_principal_insights_actionable():
    """Test that insights include recommendations"""
    response = client.post("/api/ai/principal-insights", json=SAMPLE_SCHOOL_DATA)
    
    assert response.status_code == 200
    data = response.json()
    insights = data["insights"].lower()
    
    # Should have actionable recommendations
    assert any(word in insights for word in ["recommend", "suggest", "action", "priority"])

# ============================================
# Integration Tests: Master Execution Flow
# ============================================

def test_master_execution_flow():
    """
    Test the complete master execution flow:
    Teacher absent -> Generate lesson -> Generate homework -> Analyze attendance
    """
    # Step 1: Generate continuity lesson
    lesson_response = client.post("/api/ai/continuity-lesson", json={
        "class_name": "Class 8",
        "subject": "Math",
        "current_chapter": "Chapter 1",
        "previous_topic": "Introduction"
    })
    assert lesson_response.status_code == 200
    lesson_data = lesson_response.json()
    assert lesson_data["status"] == "success"
    
    # Step 2: Generate homework
    homework_response = client.post("/api/ai/homework", json={
        "class_name": "Class 8",
        "subject": "Math",
        "chapter": "Chapter 1",
        "difficulty": "all"
    })
    assert homework_response.status_code == 200
    homework_data = homework_response.json()
    assert homework_data["status"] == "success"
    
    # Step 3: Analyze attendance
    attendance_response = client.post("/api/ai/attendance-insights", json={
        "attendance_history": SAMPLE_ATTENDANCE_DATA
    })
    assert attendance_response.status_code == 200
    attendance_data = attendance_response.json()
    assert attendance_data["status"] == "success"
    
    # Step 4: Generate principal insights
    insights_response = client.post("/api/ai/principal-insights", json=SAMPLE_SCHOOL_DATA)
    assert insights_response.status_code == 200
    insights_data = insights_response.json()
    assert insights_data["status"] == "success"
    
    # Verify all steps completed successfully
    assert all([
        lesson_data["status"] == "success",
        homework_data["status"] == "success",
        attendance_data["status"] == "success",
        insights_data["status"] == "success"
    ])

def test_error_handling():
    """Test error handling for invalid requests"""
    # Invalid class name
    response = client.post("/api/ai/continuity-lesson", json={
        "class_name": "",
        "subject": "Science",
        "current_chapter": "Chapter 1",
        "previous_topic": "Topic"
    })
    assert response.status_code in [200, 422]
    
    # Missing required fields
    response = client.post("/api/ai/homework", json={
        "class_name": "Class 8"
    })
    assert response.status_code == 422

# ============================================
# Performance Tests
# ============================================

def test_response_time_continuity_lesson():
    """Test that continuity lesson generation completes in reasonable time"""
    import time
    start = time.time()
    
    response = client.post("/api/ai/continuity-lesson", json={
        "class_name": "Class 8",
        "subject": "Science",
        "current_chapter": "Chapter 1",
        "previous_topic": "Introduction"
    })
    
    end = time.time()
    duration = end - start
    
    assert response.status_code == 200
    assert duration < 30  # Should complete within 30 seconds

def test_concurrent_requests():
    """Test handling of multiple concurrent requests"""
    import concurrent.futures
    
    def make_request():
        return client.post("/api/ai/homework", json={
            "class_name": "Class 8",
            "subject": "Science",
            "chapter": "Chapter 1",
            "difficulty": "all"
        })
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(make_request) for _ in range(5)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    
    # All requests should succeed
    assert all(r.status_code == 200 for r in results)

# ============================================
# Run Tests
# ============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
