@echo off
setlocal EnableExtensions

rem TMT Portal local launcher. This file may be started from any directory.
set "PROJECT_ROOT=%~dp0"
set "TMT_PORT=3000"
set "TMT_URL=http://localhost:%TMT_PORT%/login"

cd /d "%PROJECT_ROOT%"
if errorlevel 1 (
    echo ERROR: Could not open the TMT Portal project directory.
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ERROR: package.json was not found in "%PROJECT_ROOT%".
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is unavailable. Install Node.js and ensure it is on PATH.
    pause
    exit /b 1
)

call npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is unavailable. Install npm with Node.js and ensure it is on PATH.
    pause
    exit /b 1
)

for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %TMT_PORT% -State Listen -ErrorAction SilentlyContinue) { 'BUSY' } else { 'FREE' }"`) do set "PORT_STATE=%%P"
if /i "%PORT_STATE%"=="BUSY" (
    echo ERROR: Port %TMT_PORT% is already in use.
    echo TMT Portal was not started to avoid a conflicting development server.
    echo Close the process using port %TMT_PORT% or stop the existing TMT server normally.
    pause
    exit /b 2
)

echo Starting TMT Portal from:
echo   %PROJECT_ROOT%
echo Using: npm run dev
echo Waiting for http://localhost:%TMT_PORT% to become ready...
echo.

start "TMT Portal Development Server" /d "%PROJECT_ROOT%" cmd /k "call npm run dev"

set /a WAIT_SECONDS=0
:wait_for_server
timeout /t 1 /nobreak >nul
set /a WAIT_SECONDS+=1
for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %TMT_PORT% -State Listen -ErrorAction SilentlyContinue) { 'READY' } else { 'WAIT' }"`) do set "SERVER_STATE=%%P"
if /i "%SERVER_STATE%"=="READY" goto server_ready
if %WAIT_SECONDS% GEQ 60 goto server_timeout
goto wait_for_server

:server_ready
echo TMT Portal is listening on port %TMT_PORT%.
echo Opening %TMT_URL% in the default browser...
start "" "%TMT_URL%"
echo.
echo The development server is running in the TMT Portal terminal window.
echo Keep that window open to view logs. Press Ctrl+C there to stop the server.
endlocal
exit /b 0

:server_timeout
echo ERROR: TMT Portal did not start within 60 seconds.
echo Review the development server terminal for the startup error.
endlocal
exit /b 3
