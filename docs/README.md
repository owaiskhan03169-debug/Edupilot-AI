# EduPilot - AI-Powered School Operations System

## 🎯 Project Overview

EduPilot is a comprehensive AI-powered school management system that automates critical operations including teacher absence management, lesson generation, homework creation, attendance tracking, and administrative insights.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **AI Microservice**: Python + FastAPI + Uvicorn
- **Database**: MongoDB
- **AI Models**: OpenAI GPT-4 / Google Gemini (with mock fallback)
- **Vector DB**: ChromaDB for syllabus context retrieval

### System Architecture
```
┌─────────────────┐
│  React Frontend │
│  (Port 5173)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node.js/Express│
│  Backend        │
│  (Port 5000)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Python FastAPI │◄────►│   MongoDB    │
│  AI Service     │      │   Database   │
│  (Port 8000)    │      └──────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI/Gemini  │
│  AI Models      │
└─────────────────┘
```

## 📋 Features Implementation

### Phase 1: Syllabus Understanding Engine ✅
**Location**: `ai-service/main.py` - `/api/syllabus/upload`

Converts PDF/DOCX syllabus files into structured JSON format:
```json
{
  "Class 8": {
    "Science": {
      "Chapter 1: Light": {
        "topics": ["Reflection", "Refraction"],
        "subtopics": {
          "Reflection": ["Laws of Reflection", "Types"]
        }
      }
    }
  }
}
```

**Key Functions**:
- `parse_pdf()`: Extracts text from PDF files
- `parse_docx()`: Extracts text from DOCX files
- AI-powered structuring using custom prompts

### Phase 2: Syllabus Context Retrieval ✅
**Location**: `ai-service/main.py` - `/api/syllabus/query`

Semantic search and navigation through syllabus without re-reading files:
- Current/Previous/Next chapter queries
- Full structure retrieval
- Semantic search using ChromaDB + sentence-transformers

**Query Types**:
- `structure`: Get full syllabus hierarchy
- `current`: Get current chapter details
- `previous`: Navigate to previous chapter
- `next`: Navigate to next chapter
- `search`: Semantic search across syllabus

### Phase 3: AI Continuity Teacher (Hero Module) ✅
**Location**: `ai-service/main.py` - `/api/ai/continuity-lesson`

Generates comprehensive lesson plans when teachers are absent:

**Output Structure**:
```json
{
  "lesson_summary": "Overview of today's lesson",
  "explanation": "Detailed explanation building on previous topics",
  "examples": ["Example 1", "Example 2", "Example 3"],
  "key_concepts": ["Concept 1", "Concept 2"],
  "class_notes": "Complete notes for students"
}
```

### Phase 4: Doubt Engine ✅
**Location**: `ai-service/main.py` - `/api/ai/doubt`

Context-aware student question answering:
- ✅ Answers questions within syllabus context
- ❌ Rejects out-of-context questions (Bitcoin, politics, etc.)
- Uses semantic search to validate question relevance

**Example**:
```javascript
// Valid question
"What is reflection of light?" → Detailed answer

// Invalid question
"What is Bitcoin?" → "This question is out of syllabus context."
```

### Phase 5: Homework Generator ✅
**Location**: `ai-service/main.py` - `/api/ai/homework`

Generates difficulty-based questions following Bloom's Taxonomy:

**Output**:
```json
{
  "easy": ["Definition questions", "Basic recall"],
  "medium": ["Application problems", "Analysis questions"],
  "hard": ["Design tasks", "Evaluation questions"]
}
```

### Phase 6: Attendance Intelligence ✅
**Location**: `ai-service/main.py` - `/api/ai/attendance-insights`

Analyzes attendance patterns and identifies risks:
- Chronic absenteeism detection (>10% absence rate)
- Consecutive absence tracking
- Trend analysis
- Actionable recommendations

### Phase 7: Principal Insights ✅
**Location**: `ai-service/main.py` - `/api/ai/principal-insights`

Strategic insights for school leadership:
- Attendance trends (grade-wise, time-based)
- Fee collection analysis
- Teacher absence patterns
- Department-wise comparisons
- Priority action recommendations

### Phase 8: Prompt Library ✅
**Location**: `ai-service/prompts.py`

Optimized system prompts for each AI module:
- `SYLLABUS_PARSER_PROMPT`
- `CONTINUITY_TEACHER_PROMPT`
- `HOMEWORK_GENERATOR_PROMPT`
- `ATTENDANCE_ANALYZER_PROMPT`
- `PRINCIPAL_INSIGHTS_PROMPT`
- `DOUBT_ENGINE_PROMPT`

### Phase 9: AI Testing Suite ✅
**Location**: `ai-service/tests/test_ai.py`

Comprehensive automated tests:
- Unit tests for each AI module
- Integration tests for master flow
- Performance tests
- Error handling tests
- Edge case validation

**Run Tests**:
```bash
cd ai-service
pytest tests/test_ai.py -v
```

## 🚀 Master Execution Flow

The complete chain reaction when a teacher is marked absent:

```
1. Principal clicks "Mark Absent" on Teacher Dashboard
   ↓
2. Backend receives request → orchestrationController.handleTeacherAbsence()
   ↓
3. Teacher status updated in MongoDB
   ↓
4. AI Service: Generate Continuity Lesson (Phase 3)
   ↓
5. AI Service: Generate Homework (Phase 5)
   ↓
6. AI Service: Analyze Attendance (Phase 6)
   ↓
7. Generate Parent Alerts for absent students
   ↓
8. Save all data to MongoDB (LessonPlan, Homework, Alert, AILog)
   ↓
9. Update Analytics dashboard
   ↓
10. Return comprehensive response to frontend
   ↓
11. Frontend displays all generated materials
   ↓
12. Principal sees updated dashboard with insights
```

## 📁 Project Structure

```
edupilot-core/
├── ai-service/                 # Python FastAPI AI Microservice
│   ├── main.py                # Main FastAPI application
│   ├── prompts.py             # AI prompt library
│   ├── requirements.txt       # Python dependencies
│   └── tests/
│       └── test_ai.py         # Comprehensive test suite
│
├── backend/                    # Node.js Express Backend
│   ├── server.js              # Express server entry point
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── orchestrationController.js  # Master flow logic
│   │   │   └── authController.js
│   │   ├── models/
│   │   │   └── Schemas.js     # MongoDB schemas (11 models)
│   │   └── routes/
│   │       ├── orchestrationRoutes.js
│   │       └── authRoutes.js
│   └── package.json
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PrincipalOverview.jsx  # Dashboard
│   │   │   └── Teachers.jsx           # Teacher management
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── docs/
    └── README.md              # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- MongoDB (local or Atlas)
- OpenAI API Key or Google Gemini API Key (optional, has mock fallback)

### 1. Clone Repository
```bash
git clone <repository-url>
cd edupilot-core
```

### 2. Setup AI Service (Python)
```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (optional)
export GEMINI_API_KEY="your-gemini-api-key"
export USE_GEMINI="true"

# Run AI service
uvicorn main:app --reload --port 8000
```

### 3. Setup Backend (Node.js)
```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "MONGO_URI=mongodb://localhost:27017/edupilot" > .env
echo "AI_SERVICE_URL=http://127.0.0.1:8000" >> .env
echo "PORT=5000" >> .env

# Run backend
npm start
```

### 4. Setup Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🧪 Testing

### Run AI Service Tests
```bash
cd ai-service
pytest tests/test_ai.py -v --tb=short
```

### Test Master Execution Flow
1. Open frontend: http://localhost:5173
2. Click "Enter Principal Dashboard"
3. Navigate to "Teachers" page
4. Click "Mark Absent" on any teacher
5. Watch the complete AI workflow execute
6. View generated lesson, homework, and insights

## 📊 MongoDB Schemas

### Core Models
1. **Student**: Student information and performance metrics
2. **Teacher**: Teacher details and absence history
3. **Parent**: Parent contact and alert preferences
4. **Fee**: Fee collection and payment tracking
5. **Attendance**: Daily attendance records
6. **Syllabus**: Structured syllabus data
7. **Homework**: AI-generated homework assignments
8. **LessonPlan**: AI-generated lesson plans
9. **Alert**: Parent and admin alerts
10. **AILog**: AI activity logging
11. **Analytics**: Dashboard analytics and insights

## 🔌 API Endpoints

### AI Service Endpoints
```
POST /api/syllabus/upload          - Upload and parse syllabus
POST /api/syllabus/query           - Query syllabus context
POST /api/ai/continuity-lesson     - Generate lesson plan
POST /api/ai/homework              - Generate homework
POST /api/ai/doubt                 - Answer student questions
POST /api/ai/attendance-insights   - Analyze attendance
POST /api/ai/principal-insights    - Generate principal insights
GET  /health                       - Health check
```

### Backend Endpoints
```
POST /api/orchestration/teacher/:id/absent  - Trigger master flow
GET  /api/orchestration/insights            - Get principal insights
GET  /api/orchestration/dashboard/stats     - Get dashboard statistics
GET  /api/orchestration/ai/logs             - Get recent AI logs
```

## 🎨 Frontend Pages

### 1. Principal Overview Dashboard
- Real-time metrics (students, teachers, fees, AI activity)
- AI strategic insights
- Critical workflow triggers
- Recent AI activity log
- Quick stats summary

### 2. Teachers Management
- Teacher list with status
- Mark absent/present functionality
- AI continuity system activation
- Master execution flow results display
- Detailed lesson and homework view

## 🔐 Environment Variables

### AI Service (.env)
```bash
GEMINI_API_KEY=your-api-key
OPENAI_API_KEY=your-api-key
USE_GEMINI=true
USE_OPENAI=false
```

### Backend (.env)
```bash
MONGO_URI=mongodb://localhost:27017/edupilot
AI_SERVICE_URL=http://127.0.0.1:8000
PORT=5000
NODE_ENV=development
```

## 🚨 Troubleshooting

### AI Service Not Responding
```bash
# Check if service is running
curl http://localhost:8000/health

# Check logs
cd ai-service
uvicorn main:app --reload --log-level debug
```

### Backend Connection Issues
```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/edupilot

# Check backend logs
cd backend
npm start
```

### Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 📈 Performance Metrics

- **Lesson Generation**: ~2-5 seconds
- **Homework Generation**: ~2-4 seconds
- **Attendance Analysis**: ~1-3 seconds
- **Principal Insights**: ~3-6 seconds
- **Master Flow Execution**: ~8-15 seconds (all phases)

## 🔮 Future Enhancements

1. **Real-time Notifications**: WebSocket integration for live updates
2. **Mobile App**: React Native mobile application
3. **Advanced Analytics**: ML-based predictive analytics
4. **Multi-language Support**: i18n implementation
5. **Video Lessons**: AI-generated video content
6. **Student Portal**: Dedicated student interface
7. **Parent Portal**: Parent communication platform
8. **Exam Generator**: Automated exam paper creation
9. **Performance Tracking**: Student progress monitoring
10. **Integration APIs**: Third-party system integrations

## 👥 Contributors

- **AI Architecture**: Advanced GenAI integration with fallback mechanisms
- **Backend Development**: Robust orchestration and data management
- **Frontend Development**: Modern React UI with real-time updates
- **Testing**: Comprehensive test coverage across all modules

## 📄 License

This project is proprietary software developed for educational institutions.

## 📞 Support

For technical support or questions:
- Email: support@edupilot.com
- Documentation: http://localhost:8000/docs
- GitHub Issues: [Repository Issues]

---

**Built with ❤️ for Education**