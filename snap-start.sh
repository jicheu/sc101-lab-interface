#!/bin/bash

# SC101 Lab Interface - Snap Production Start Script
# Only runs the backend server (frontend is pre-built)

echo "🚀 Starting SC101 Lab Interface Backend..."

# Set up environment
export PATH="$SNAP/usr/bin:$PATH"
export LD_LIBRARY_PATH="$SNAP/usr/lib:$LD_LIBRARY_PATH"

# Change to backend directory within the snap
cd "$SNAP/backend" || {
    echo "Error: Cannot find backend directory at $SNAP/backend"
    exit 1
}

# Debug info
echo "Current directory: $(pwd)"
echo "SNAP directory: $SNAP"

# Start backend server with full path
exec "$SNAP/usr/bin/node" "$SNAP/backend/server.js"