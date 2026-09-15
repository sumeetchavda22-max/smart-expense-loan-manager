@echo off
REM The app is local-first now: all data lives in the browser (IndexedDB), so only the
REM frontend needs to run. The old backend/ server is legacy and NOT required.
start "SMT-C (:3000)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo   PC:      http://localhost:3000
echo   iPhone:  http://^<this PC IP^>:3000   (same Wi-Fi; see README "Run on your iPhone")
echo.
echo   To run the legacy Express+SQLite server instead, see README "Legacy" section.
echo.
