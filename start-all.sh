#!/bin/bash

# EduPilot - Start All Services Script
# This script starts all three services in the correct order

echo "🚀 Starting EduPilot System..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    else
        return 0
    fi
}

# Check if required ports are available
echo -e "${BLUE}Checking ports...${NC}"
check_port 8000 || exit 1
check_port 5000 || exit 1
check_port 5173 || exit 1

# Start AI Service (Python FastAPI)
echo -e "\n${GREEN}1. Starting AI Service (Port 8000)...${NC}"
cd ai-service

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -q -r requirements.txt

# Start AI service in background
echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/ai-service.log 2>&1 &
AI_PID=$!
echo "AI Service PID: $AI_PID"

# Wait for AI service to start
sleep 3
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ AI Service started successfully${NC}"
else
    echo -e "${YELLOW}⚠️  AI Service may not be ready yet${NC}"
fi

cd ..

# Start Backend (Node.js Express)
echo -e "\n${GREEN}2. Starting Backend (Port 5000)...${NC}"
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Start backend in background
echo "Starting Express server..."
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3
if curl -s http://localhost:5000 > /dev/null; then
    echo -e "${GREEN}✓ Backend started successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may not be ready yet${NC}"
fi

cd ..

# Start Frontend (React + Vite)
echo -e "\n${GREEN}3. Starting Frontend (Port 5173)...${NC}"
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
echo "Starting Vite dev server..."
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..

# Wait for all services to be ready
echo -e "\n${BLUE}Waiting for all services to be ready...${NC}"
sleep 5

# Display status
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✓ EduPilot System Started!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Service Status:"
echo "  AI Service:  http://localhost:8000 (PID: $AI_PID)"
echo "  Backend:     http://localhost:5000 (PID: $BACKEND_PID)"
echo "  Frontend:    http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Logs are available in the 'logs/' directory"
echo ""
echo -e "${YELLOW}To stop all services, run: ./stop-all.sh${NC}"
echo ""

# Save PIDs to file for stop script
echo "$AI_PID" > .pids
echo "$BACKEND_PID" >> .pids
echo "$FRONTEND_PID" >> .pids

# Keep script running and show logs
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
echo ""

# Trap Ctrl+C and cleanup
trap 'echo ""; echo "Stopping all services..."; kill $AI_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .pids; echo "All services stopped."; exit 0' INT

# Wait for user interrupt
wait

# Made with Bob
