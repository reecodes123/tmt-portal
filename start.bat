@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 (
    echo ERROR: Could not open the project folder.
    goto fail
)

echo ========================================
echo THE MATRIX TODAY PORTAL
echo ========================================
echo.

if not exist "package.json" (
    echo ERROR: package.json was not found beside start.bat.
    goto fail
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is unavailable. Install Node.js and ensure it is on PATH.
    goto fail
)

call npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is unavailable. Install npm with Node.js and ensure it is on PATH.
    goto fail
)

echo Make sure MySQL is running.
echo Starting TMT Portal...
echo Open http://localhost:3000 once Next.js reports that it is ready.
echo Keep this window open while using the portal. Press Ctrl+C to stop.
echo.

call npm run dev
if errorlevel 1 (
    echo.
    echo ERROR: TMT Portal exited with an error. Review the output above.
    goto fail
)

endlocal
exit /b 0

:fail
echo.
pause
endlocal
exit /b 1
