#!/bin/bash

# SC101 Lab Interface - Start Script
# Launches both backend and frontend servers

echo "🚀 Starting SC101 Lab Interface..."

# Kill any existing instances
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Wait for cleanup
sleep 1

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n\n🛑 Shutting down..."
    pkill -f "node server.js" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup SIGINT SIGTERM

# Start backend server
echo "📡 Starting backend server on port 3001..."
cd backend
node server.js &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start frontend dev server
echo "🎨 Starting frontend dev server on port 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo -e "\n✅ SC101 Lab Interface is running!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo -e "\nPress Ctrl+C to stop both servers\n"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID