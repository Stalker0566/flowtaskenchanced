@echo off
git add .
git commit -m "Fix task deletion: remove confirmation modal and add compact undo notification"
git push origin main
echo Done! Check GitHub now.
pause
