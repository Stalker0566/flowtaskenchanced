@echo off
echo Building React components for TaskFlow...

cd react

echo Installing dependencies...
call npm install

echo Building React components...
call npm run build

echo Build complete! React components are now available in js/react-build/
echo You can now use React components in your HTML pages.

pause
