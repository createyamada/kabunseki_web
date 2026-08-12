@echo off
setlocal

rem Always run from the directory containing this file.
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 goto :node_missing
where npm >nul 2>&1
if errorlevel 1 goto :node_missing

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm ci
  if errorlevel 1 goto :install_failed
)

echo Starting Kabunseki Web...
echo The app will open at http://localhost:3000
echo Press Ctrl+C to stop it.
call npm start

if errorlevel 1 (
  echo.
  echo The application stopped with an error.
  pause
)
exit /b %errorlevel%

:node_missing
echo Node.js and npm are required.
echo Install the LTS version from https://nodejs.org/ and try again.
pause
exit /b 1

:install_failed
echo.
echo Dependency installation failed.
pause
exit /b 1
