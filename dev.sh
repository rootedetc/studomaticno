#!/bin/bash

# Simple dev script - starts both backend and frontend
# Usage: ./dev.sh

echo "Starting Libertas PWA..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if ports are available
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Port $1 is busy, waiting...${NC}"
    return 1
  fi
  return 0
}

# Start backend
echo -e "${GREEN}[1/2] Starting backend on port 3001...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend
sleep 2

# Start frontend
echo -e "${GREEN}[2/2] Starting frontend on port 5173...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Libertas PWA is running!${NC}"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo -e "${GREEN}================================${NC}"

# Trap Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Wait for processes
wait
