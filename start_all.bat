@echo off
SETLOCAL
SET ROOT_DIR=%~dp0

echo.
echo ==========================================
echo  Starting GesturaNet Multi-Tier Stack
echo ==========================================

:: 1. Start Backend
echo [1/3] Starting Node.js Backend...
cd /d "%ROOT_DIR%backend"
start "GN_Backend" cmd /c "npm run dev"
timeout /t 2 /nobreak > nul

:: 2. Start Frontend
echo [2/3] Starting React Frontend...
cd /d "%ROOT_DIR%frontend\gesturaNet-frontend"
start "GN_Frontend" cmd /c "npm run dev"
timeout /t 2 /nobreak > nul

:: 3. Start Python Engine
echo [3/3] Initializing Python Engine...
cd /d "%ROOT_DIR%Engine"
start "GN_Engine" cmd /c "call ..\env\Scripts\activate.bat && python main.py"

:: ── Launch watchdog using a lock-file approach ───────────────────────────────
:: Create a lock file that the watchdog monitors. When this batch exits (any way),
:: the lock is released and the watchdog kills all child windows.
cd /d "%ROOT_DIR%"
set "LOCKFILE=%ROOT_DIR%.gn_running.lock"
echo locked > "%LOCKFILE%"

start "" /B powershell -NoProfile -WindowStyle Hidden -Command ^
    "$lockPath='%LOCKFILE%'; ^
     Start-Sleep -Seconds 3; ^
     while ($true) { ^
         Start-Sleep -Seconds 1; ^
         try { ^
             $stream = [System.IO.File]::Open($lockPath, 'Open', 'ReadWrite', 'None'); ^
             $stream.Close(); ^
             break ^
         } catch { ^
             continue ^
         } ^
     }; ^
     Remove-Item $lockPath -Force -ErrorAction SilentlyContinue; ^
     taskkill /F /FI 'WINDOWTITLE eq GN_Backend*' /T 2>$null; ^
     taskkill /F /FI 'WINDOWTITLE eq GN_Frontend*' /T 2>$null; ^
     taskkill /F /FI 'WINDOWTITLE eq GN_Engine*' /T 2>$null"

echo.
echo ==========================================
echo  Services are running:
echo  - Backend:  http://localhost:5000
echo  - Frontend: http://localhost:5173
echo.
echo  Press any key or close this window
echo  to stop ALL services.
echo ==========================================

:: Hold the lock file open, keeping the watchdog in "wait" mode.
:: When this command terminates (any way: keypress, Ctrl+C, window close),
:: the file handle is released and the watchdog triggers cleanup.
(
    pause
) >> "%LOCKFILE%" 2>&1

:: ── Normal exit path ─────────────────────────────────────────────────────────
echo.
echo [!] Terminating all GesturaNet processes...
taskkill /F /FI "WINDOWTITLE eq GN_Backend*" /T > nul 2>&1
taskkill /F /FI "WINDOWTITLE eq GN_Frontend*" /T > nul 2>&1
taskkill /F /FI "WINDOWTITLE eq GN_Engine*" /T > nul 2>&1
del "%LOCKFILE%" > nul 2>&1
echo [OK] All services stopped.
timeout /t 1 /nobreak > nul
exit
