# EduPilot - Complete Setup & Deployment Guide

## 🎯 Quick Start (5 Minutes)

### Step 1: Start AI Service
```bash
cd edupilot-core/ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 2: Start Backend
```bash
cd edupilot-core/backend
npm install
npm start
```

### Step 3: Start Frontend
```bash
cd edupilot-core/frontend
npm install
npm run dev
```

### Step 4: Test the System
1. Open http://localhost:5173
2. Click "Enter Principal Dashboard"
3. Go to "Teachers" page
4. Click "Mark Absent" on any teacher
5. Watch the AI magic happen! ✨

---

## 📋 Detailed Setup Instructions

### Prerequisites Installation

#### 1. Install Node.js
```bash
# Download from https://nodejs.org/ (v18 or higher)
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### 2. Install Python
```bash
# Download from https://python.org/ (v3.9 or higher)
python --version  # Should show 3.9.x or higher
pip --version     # Should show pip version
```

#### 3. Install MongoDB
**Option A: Local Installation**
```bash
# Download from https://www.mongodb.com/try/download/community
# Start MongoDB service
mongod --dbpath /path/to/data/directory
```

**Option B: MongoDB Atlas (Cloud)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Use in backend .env file

---

## 🔧 Detailed Component Setup

### AI Service Setup (Python FastAPI)

#### 1. Navigate to AI Service Directory
```bash
cd edupilot-core/ai-service
```

#### 2. Create Virtual Environment
```bash
# Create venv
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure Environment (Optional)
Create `.env` file in `ai-service/` directory:
```bash
# For Google Gemini (Recommended)
GEMINI_API_KEY=your_gemini_api_key_here
USE_GEMINI=true

# OR for OpenAI
OPENAI_API_KEY=your_openai_api_key_here
USE_OPENAI=true

# Note: System works with mock responses if no API key provided
```

#### 5. Start AI Service
```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 6. Verify AI Service
```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","service":"EduPilot AI Microservice","version":"1.0.0"}
```

---

### Backend Setup (Node.js Express)

#### 1. Navigate to Backend Directory
```bash
cd edupilot-core/backend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment
Create `.env` file in `backend/` directory:
```bash
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/edupilot
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/edupilot

# AI Service URL
AI_SERVICE_URL=http://127.0.0.1:8000

# Server Port
PORT=5000

# Environment
NODE_ENV=development
```

#### 4. Start Backend Server
```bash
# Development mode
npm start

# OR with nodemon for auto-reload
npm run dev
```

#### 5. Verify Backend
```bash
# Test root endpoint
curl http://localhost:5000/

# Expected response:
# "EduPilot Core Backend is running!"
```

---

### Frontend Setup (React + Vite)

#### 1. Navigate to Frontend Directory
```bash
cd edupilot-core/frontend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment (Optional)
Create `.env` file in `frontend/` directory:
```bash
VITE_API_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
```

#### 4. Start Development Server
```bash
npm run dev
```

#### 5. Build for Production
```bash
npm run build
npm run preview  # Preview production build
```

#### 6. Access Frontend
Open browser and navigate to:
```
http://localhost:5173
```

---

## 🧪 Testing the Complete System

### 1. Run AI Service Tests
```bash
cd edupilot-core/ai-service
pytest tests/test_ai.py -v

# Run specific test
pytest tests/test_ai.py::test_continuity_lesson_generation -v

# Run with coverage
pytest tests/test_ai.py --cov=main --cov-report=html
```

### 2. Test Master Execution Flow

#### Via Frontend (Recommended)
1. Open http://localhost:5173
2. Click "Enter Principal Dashboard"
3. Navigate to "Teachers" tab
4. Click "Mark Absent" on "Arjun Sharma (Mathematics)"
5. Wait 5-10 seconds
6. Observe the complete workflow execution
7. Review generated lesson, homework, and insights

#### Via API (Direct Testing)
```bash
# Test teacher absence endpoint
curl -X POST http://localhost:5000/api/orchestration/teacher/1/absent

# Test principal insights
curl http://localhost:5000/api/orchestration/insights

# Test dashboard stats
curl http://localhost:5000/api/orchestration/dashboard/stats
```

### 3. Test Individual AI Modules

#### Test Continuity Teacher
```bash
curl -X POST http://localhost:8000/api/ai/continuity-lesson \
  -H "Content-Type: application/json" \
  -d '{
    "class_name": "Class 8",
    "subject": "Science",
    "current_chapter": "Chapter 1: Light",
    "previous_topic": "Introduction to Light"
  }'
```

#### Test Homework Generator
```bash
curl -X POST http://localhost:8000/api/ai/homework \
  -H "Content-Type: application/json" \
  -d '{
    "class_name": "Class 8",
    "subject": "Science",
    "chapter": "Chapter 1: Light",
    "difficulty": "all"
  }'
```

#### Test Doubt Engine
```bash
curl -X POST http://localhost:8000/api/ai/doubt \
  -H "Content-Type: application/json" \
  -d '{
    "class_name": "Class 8",
    "subject": "Science",
    "question": "What is reflection of light?"
  }'
```

---

## 🐛 Troubleshooting

### Issue: AI Service Won't Start

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
cd ai-service
source venv/bin/activate  # Ensure venv is activated
pip install -r requirements.txt
```

---

### Issue: Backend Can't Connect to MongoDB

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
```bash
# Check if MongoDB is running
mongosh

# If not running, start MongoDB
mongod --dbpath /path/to/data

# OR use MongoDB Atlas connection string in .env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/edupilot
```

---

### Issue: Frontend Can't Connect to Backend

**Error**: `Network Error` or `CORS Error`

**Solution**:
1. Verify backend is running on port 5000
2. Check CORS configuration in `backend/server.js`
3. Ensure frontend is using correct API URL

```javascript
// In frontend code, verify:
axios.get('http://localhost:5000/api/...')
```

---

### Issue: AI Service Returns Mock Data

**Symptom**: AI responses seem generic or templated

**Solution**:
This is expected behavior when no API key is configured. To use real AI:

```bash
# Add to ai-service/.env
GEMINI_API_KEY=your_actual_api_key
USE_GEMINI=true

# Restart AI service
uvicorn main:app --reload
```

---

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using the port
# Linux/Mac:
lsof -i :5000
kill -9 <PID>

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# OR use different port
PORT=5001 npm start
```

---

## 🚀 Production Deployment

### Deploy AI Service (Python)

#### Option 1: Docker
```dockerfile
# Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t edupilot-ai .
docker run -p 8000:8000 edupilot-ai
```

#### Option 2: Heroku
```bash
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
heroku create edupilot-ai
git push heroku main
```

---

### Deploy Backend (Node.js)

#### Option 1: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

#### Option 2: Heroku
```bash
heroku create edupilot-backend
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set AI_SERVICE_URL=your_ai_service_url
git push heroku main
```

---

### Deploy Frontend (React)

#### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

#### Option 2: Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

#### Option 3: Docker + Nginx
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env files
echo ".env" >> .gitignore

# Use environment-specific configs
.env.development
.env.production
```

### 2. API Keys
```bash
# Rotate API keys regularly
# Use key management services (AWS Secrets Manager, etc.)
# Implement rate limiting
```

### 3. Database Security
```bash
# Use strong passwords
# Enable authentication
# Restrict network access
# Regular backups
```

---

## 📊 Monitoring & Logging

### Setup Logging
```javascript
// Backend: Use Winston or Morgan
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Monitor Performance
```bash
# Use PM2 for Node.js
npm install -g pm2
pm2 start server.js --name edupilot-backend
pm2 monit
```

---

## 🎓 Next Steps

1. ✅ Complete setup and verify all services are running
2. ✅ Test the master execution flow
3. ✅ Review generated AI content quality
4. ✅ Configure real AI API keys for production
5. ✅ Set up MongoDB with real data
6. ✅ Deploy to production environment
7. ✅ Set up monitoring and alerts
8. ✅ Train staff on system usage

---

## 📞 Support & Resources

- **Documentation**: See `docs/README.md`
- **API Docs**: http://localhost:8000/docs (FastAPI auto-generated)
- **GitHub Issues**: Report bugs and feature requests
- **Email Support**: support@edupilot.com

---

**Happy Deploying! 🚀**