#!/bin/bash
# Syndicate — start both backend and frontend dev servers

echo "🏛  Starting Syndicate..."
echo ""

# Backend
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=${PORT:-3001}
echo "→ Starting backend on http://localhost:$BACKEND_PORT"
(cd "$SCRIPT_DIR/backend" && PORT=$BACKEND_PORT node server.js) &
BACKEND_PID=$!

# Give backend a moment
sleep 1

# Frontend
echo "→ Starting frontend on http://localhost:5173"
(cd "$SCRIPT_DIR/frontend" && BACKEND_PORT=$BACKEND_PORT npm run dev) &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Syndicate running!"
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:$BACKEND_PORT"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
