@echo off
echo ════════════════════════════════════════
echo   ClinicalAI — Docker Deployment
echo ════════════════════════════════════════

echo.
echo [1] Building containers...
docker-compose build

echo.
echo [2] Starting services...
docker-compose up -d

echo.
echo [3] Checking health...
timeout /t 10

docker-compose ps

echo.
echo ════════════════════════════════════════
echo   System Running!
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:80
echo   API Docs : http://localhost:8000/docs
echo ════════════════════════════════════════