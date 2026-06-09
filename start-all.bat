@echo off
REM EduPilot - Start All Services Script (Windows)

echo ========================================
echo Starting EduPilot System...
echo ========================================
echo.

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Start AI Service (Python FastAPI)
echo [1/3] Starting AI Service (Port 8000)...
cd ai-service

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
pip install -q -r requirements.txt

REM Start AI service in new window
echo Starting FastAPI server...
start "EduPilot AI Service" cmd /k "venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000"

cd ..
timeout /t 3 /nobreak >nul

REM Start Backend (Node.js Express)
echo.
echo [2/3] Starting Backend (Port 5000)...
cd backend

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

REM Start backend in new window
echo Starting Express server...
start "EduPilot Backend" cmd /k "npm start"

cd ..
timeout /t 3 /nobreak >nul

REM Start Frontend (React + Vite)
echo.
echo [3/3] Starting Frontend (Port 5173)...
cd frontend

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

REM Start frontend in new window
echo Starting Vite dev server...
start "EduPilot Frontend" cmd /k "npm run dev"

cd ..

REM Wait for services to start
echo.
echo Waiting for all services to be ready...
timeout /t 5 /nobreak >nul

REM Display status
echo.
echo ========================================
echo EduPilot System Started Successfully!
echo ========================================
echo.
echo Service URLs:
echo   AI Service:  http://localhost:8000
echo   Backend:     http://localhost:5000
echo   Frontend:    http://localhost:5173
echo.
echo API Documentation: http://localhost:8000/docs
echo.
echo To stop all services, close all command windows
echo or run: stop-all.bat
echo.
echo Press any key to exit this window...
pause >nul

@REM Made with Bob
