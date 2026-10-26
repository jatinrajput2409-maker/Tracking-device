@echo off
echo ====================================================
echo Starting Dynamic Multi-Module Monitoring Platform
echo ====================================================
start "Monitoring Backend" cmd /k "java -jar %~dp0backend\target\monitoring-platform-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul
start "Monitoring Frontend" cmd /k "cd %~dp0frontend && npm run dev"
echo Backend and Frontend launched!
echo Open http://localhost:5173 in your browser.
