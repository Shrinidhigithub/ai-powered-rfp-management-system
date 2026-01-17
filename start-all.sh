#!/bin/bash

# Kill any existing node processes to avoid port conflicts
echo "Cleaning up ports..."
fuser -k 3001/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

echo "🚀 Starting RFP Management System..."

# Start Backend
echo "Starting Backend..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!

# Start Email Poller
echo "Starting Email Poller..."
nohup node gmail/poll-inbox.js > poll.log 2>&1 &
POLLER_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: http://localhost:5173"
echo "   - Email Poller: Running in background (logs in backend/poll.log)"
echo ""
echo "Press CTRL+C to stop all services."

# Wait for user to exit
trap "kill $BACKEND_PID $POLLER_PID $FRONTEND_PID; exit" SIGINT
wait
