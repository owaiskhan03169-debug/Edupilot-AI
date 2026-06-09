@echo off
REM EduPilot - Stop All Services Script (Windows)

echo ========================================
echo Stopping EduPilot System...
echo ========================================
echo.

REM Kill processes on port 8000 (AI Service)
echo Stopping AI Service (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill processes on port 5000 (Backend)
echo Stopping Backend (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill processes on port 5173 (Frontend)
echo Stopping Frontend (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill any remaining Node.js and Python processes related to EduPilot
echo Cleaning up remaining processes...
taskkill /F /FI "WINDOWTITLE eq EduPilot*" >nul 2>&1

echo.
echo ========================================
echo All services stopped successfully!
echo ========================================
echo.
pause

@REM Made with Bob
