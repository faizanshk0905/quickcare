@echo off
title QuickCare Backend
cd /d "%~dp0backend"
echo ========================================================
echo Starting QuickCare Spring Boot Backend on port 8080...
echo ========================================================
set "JAVA_EXE=java"
if exist "C:\tools\jdk17\bin\java.exe" set "JAVA_EXE=C:\tools\jdk17\bin\java.exe"
"%JAVA_EXE%" -jar target\quickcare-backend-1.0.0.jar
pause
