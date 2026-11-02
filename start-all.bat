@echo off
echo ========================================================
echo Starting QUICK CARE Full-Stack System...
echo ========================================================
start "QuickCare Backend (Port 8080)" "%~dp0start-backend.bat"
echo Waiting for backend to initialize...
timeout /t 6 /nobreak >nul
start "QuickCare Frontend (Port 5173)" "%~dp0start-frontend.bat"
echo.
echo ========================================================
echo QuickCare is running!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo Swagger:  http://localhost:8080/swagger-ui.html
echo ========================================================
