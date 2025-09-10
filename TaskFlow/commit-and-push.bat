@echo off
echo Adding all files...
git add .

echo Committing changes...
git commit -m "Fix task deletion: remove confirmation modal and add compact undo notification"

echo Pushing to main branch...
git push origin main

echo Done!
pause
