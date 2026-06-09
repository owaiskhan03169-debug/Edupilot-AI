#!/bin/bash

# EduPilot - Stop All Services Script

echo "🛑 Stopping EduPilot System..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if PID file exists
if [ ! -f ".pids" ]; then
    echo -e "${RED}No running services found (no .pids file)${NC}"
    echo "Attempting to kill processes on ports 8000, 5000, 5173..."
    
    # Try to kill processes on known ports
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    
    echo -e "${GREEN}✓ Cleanup complete${NC}"
    exit 0
fi

# Read PIDs from file
AI_PID=$(sed -n '1p' .pids)
BACKEND_PID=$(sed -n '2p' .pids)
FRONTEND_PID=$(sed -n '3p' .pids)

# Stop AI Service
if [ ! -z "$AI_PID" ]; then
    echo "Stopping AI Service (PID: $AI_PID)..."
    kill $AI_PID 2>/dev/null && echo -e "${GREEN}✓ AI Service stopped${NC}" || echo -e "${RED}✗ AI Service not running${NC}"
fi

# Stop Backend
if [ ! -z "$BACKEND_PID" ]; then
    echo "Stopping Backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✓ Backend stopped${NC}" || echo -e "${RED}✗ Backend not running${NC}"
fi

# Stop Frontend
if [ ! -z "$FRONTEND_PID" ]; then
    echo "Stopping Frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✓ Frontend stopped${NC}" || echo -e "${RED}✗ Frontend not running${NC}"
fi

# Clean up PID file
rm -f .pids

# Additional cleanup - kill any remaining processes on the ports
echo "Performing additional cleanup..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo -e "\n${GREEN}✓ All services stopped successfully${NC}"

# Made with Bob
