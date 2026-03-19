@echo off
:: 使用 ANSI 编码避免乱码
chcp 65001 >nul
color 0A

echo ===================================================
echo   火星零撸 Web3 项目 - Windows 服务器一键部署工具 (修复版)
echo ===================================================
echo.

:: 1. 检查 Node.js 是否安装
echo [1/4] 检查 Node.js 环境...
where node >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo [错误] 你的服务器还没有安装 Node.js！
    echo 请先手动下载并安装 Node.js：
    echo 下载地址: https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo 安装完成后，请关闭这个窗口，重新打开此脚本！
    pause
    exit /b
) else (
    echo [OK] Node.js 已安装。
)

echo.
:: 2. 检查 npm
echo [2/4] 检查 npm...
where npm >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo [错误] npm 未找到，可能是 Node.js 环境变量未配置。重启服务器可能解决此问题。
    pause
    exit /b
) else (
    echo [OK] npm 已就绪。
)

echo.
:: 3. 启动后端
echo [3/4] 正在配置后端...
if not exist "backend" (
    color 0C
    echo [错误] 找不到 backend 文件夹，请确保你在正确的目录解压了文件！
    pause
    exit /b
)
cd backend
echo 正在安装后端依赖...
call npm install
echo 正在启动后端 (独立窗口)...
start "Marx-Backend" cmd /c "node index.js"
cd ..

echo.
:: 4. 启动前端
echo [4/4] 正在配置前端...
if not exist "frontend" (
    color 0C
    echo [错误] 找不到 frontend 文件夹！
    pause
    exit /b
)
cd frontend
echo 正在安装前端依赖...
call npm install
echo 正在编译前端代码 (这可能需要 1-3 分钟，请耐心等待)...
call npm run build
echo 正在启动前端 (独立窗口)...
start "Marx-Frontend" cmd /c "npm run start"
cd ..

echo.
echo ===================================================
echo   部署指令已发送完毕！
echo   请检查是否弹出了两个新的黑色窗口（分别运行前端和后端）。
echo   如果弹出，请不要关闭它们。
echo.
echo   现在你可以打开浏览器访问:
echo   http://38.165.40.27:3000
echo ===================================================
echo.
pause
