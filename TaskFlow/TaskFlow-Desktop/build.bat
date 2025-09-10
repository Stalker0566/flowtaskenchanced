@echo off
echo ========================================
echo TaskFlow Desktop - Build Script
echo ========================================
echo.

echo Building TaskFlow Desktop for Windows...
echo.

echo Step 1: Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Building the application...
npm run build

if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Creating Windows installer...
npm run dist

if %errorlevel% neq 0 (
    echo ERROR: Failed to create installer!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo The Windows installer has been created in the 'dist' folder.
echo Look for 'TaskFlow Setup.exe' to install the application.
echo.
echo You can now distribute this installer to other Windows users.
echo.
pause
