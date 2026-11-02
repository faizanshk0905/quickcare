@echo off
title QuickCare Backend
cd /d "%~dp0backend"
echo ========================================================
echo Starting QuickCare Spring Boot Backend on port 8080...
echo ========================================================
java -jar target\quickcare-backend-1.0.0.jar
pause
