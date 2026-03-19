@echo off

cd backend
call npm install
start node index.js

cd ../frontend
call npm install
call npm run build
start npm run start
