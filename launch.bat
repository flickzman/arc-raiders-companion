@echo off
setlocal
title ARC Raiders Companion

echo ========================================================
echo             ARC RAIDERS COMPANION LAUNCHER
echo ========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please download and install Node.js (v18+) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [SETUP] First-time setup detected. Installing dependencies...
    echo This may take a minute...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
)

echo.
echo [LAUNCH] Starting local companion server...
echo [LAUNCH] Opening http://localhost:5173 in your default browser...
echo.

start http://localhost:5173
call npm run dev

pause
