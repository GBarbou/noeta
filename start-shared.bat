@echo off
title ProofreadAI - Shared Mode
color 0A

echo.
echo  ================================================
echo   ProofreadAI - Shared Mode
echo   Starting backend + frontend + tunnel
echo  ================================================
echo.

:: ---- Configuration ----
set APP_DIR=C:\Users\konst\Desktop\APP

:: ---- Check cloudflared ----
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] cloudflared not found.
    echo.
    echo      Install with: winget install Cloudflare.cloudflared
    echo.
    echo      Or download from:
    echo      https://github.com/cloudflare/cloudflared/releases/latest
    echo.
    pause
    exit /b 1
)

:: ---- Start Backend ----
echo  [1/3] Starting Backend (FastAPI port 8000)...
cd /d "%APP_DIR%"
start "ProofreadAI-Backend" cmd /c "cd /d %APP_DIR% && python main.py"
echo        Waiting for backend...
timeout /t 4 /nobreak >nul

:: ---- Start Frontend ----
echo  [2/3] Starting Frontend (Next.js port 3000)...
start "ProofreadAI-Frontend" cmd /c "cd /d %APP_DIR%\frontend && npm run dev"
echo        Waiting for frontend...
timeout /t 6 /nobreak >nul

:: ---- Start Cloudflare Tunnel ----
echo  [3/3] Starting Cloudflare Tunnel...
echo.
echo  ================================================
echo.
echo   Look below for a line like:
echo.
echo     https://xxxxx.trycloudflare.com
echo.
echo   Send THAT URL to your collaborator!
echo.
echo   - No time limit (runs as long as you want)
echo   - No account needed
echo   - No bandwidth limit
echo   - FREE
echo.
echo   Keep this window open!
echo  ================================================
echo.

cloudflared tunnel --url http://localhost:3000

:: Cleanup
echo.
echo  Shutting down...
taskkill /FI "WINDOWTITLE eq ProofreadAI-Backend" >nul 2>&1
taskkill /FI "WINDOWTITLE eq ProofreadAI-Frontend" >nul 2>&1
echo  Done!
pause
