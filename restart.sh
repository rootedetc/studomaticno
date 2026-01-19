#!/bin/bash
echo "Stopping services..."
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

echo "Starting backend..."
cd /Users/marko/Downloads/libertas-pwa/backend && npm run dev > /tmp/backend.log 2>&1 &
sleep 2

echo "Starting frontend..."
cd /Users/marko/Downloads/libertas-pwa/frontend && npm run dev > /tmp/frontend.log 2>&1 &
sleep 2

echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Logs:"
echo "Backend: tail /tmp/backend.log"
echo "Frontend: tail /tmp/frontend.log"
