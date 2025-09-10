@echo off
echo ========================================
echo TaskFlow Desktop - Installation Script
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    echo Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start TaskFlow Desktop in development mode:
echo   npm run dev
echo.
echo To build the Windows installer:
echo   npm run build
echo.
echo To create the final installer:
echo   npm run dist
echo.
pause
