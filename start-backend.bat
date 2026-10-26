@echo off
echo ====================================================
echo Starting Spring Boot Monitoring Backend on Port 8080
echo ====================================================
java -jar "%~dp0backend\target\monitoring-platform-1.0.0-SNAPSHOT.jar"
pause
