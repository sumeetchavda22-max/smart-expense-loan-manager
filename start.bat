@echo off
REM Starts backend + frontend in two windows. Ports 5000/5001 are used by other apps on this PC, so the API runs on 5002.
start "SmartFinance Backend (API :5002)" cmd /k "cd /d %~dp0backend && set PORT=5002 && npm run dev"
start "SmartFinance Frontend (:3000)" cmd /k "cd /d %~dp0frontend && set BACKEND_PORT=5002 && npm run dev"
echo.
echo   PC:      http://localhost:3000
echo   iPhone:  http://^<this PC IP^>:3000   (same Wi-Fi; see README "Run on your iPhone")
echo.
