#!/usr/bin/env bash
set -e

echo "========================================================"
echo "            ARC RAIDERS COMPANION LAUNCHER              "
echo "========================================================"
echo ""

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed or not in your PATH."
    echo "Please download and install Node.js (v18+) from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "[SETUP] First-time setup detected. Installing dependencies..."
    npm install
fi

echo ""
echo "[LAUNCH] Starting local companion server..."
echo "[LAUNCH] Opening http://localhost:5173 in your default browser..."
echo ""

# Open default browser
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5173" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
    open "http://localhost:5173" >/dev/null 2>&1 &
fi

npm run dev
