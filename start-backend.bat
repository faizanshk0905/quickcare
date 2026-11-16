@echo off
title QuickCare Backend
cd /d "%~dp0backend"
echo ========================================================
echo Starting QuickCare Spring Boot Backend on port 8080...
echo ========================================================
set "JAVA_EXE=java"
if exist "C:\tools\jdk17\bin\java.exe" set "JAVA_EXE=C:\tools\jdk17\bin\java.exe"
set "JAR_FILE=target\quickcare-backend.jar"
if not exist "%JAR_FILE%" set "JAR_FILE=target\quickcare-backend-1.0.0.jar"
"%JAVA_EXE%" -jar "%JAR_FILE%"
pause
