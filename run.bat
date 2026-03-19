@echo off

echo Starting Backend Setup...
cd backend
call npm install
echo Starting Backend Server...
start "Backend" cmd /k "node index.js"
cd ..

echo.
echo Starting Frontend Setup...
cd frontend
call npm install
echo Building Frontend...
call npm run build
echo Starting Frontend Server...
start "Frontend" cmd /k "npm run start"
cd ..

echo.
echo Setup Complete!
pause
