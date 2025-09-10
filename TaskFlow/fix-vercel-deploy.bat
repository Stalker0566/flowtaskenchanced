@echo off
echo Fixing Vercel deployment...

echo Adding all files...
git add .

echo Committing Vercel fix...
git commit -m "Fix Vercel deployment configuration"

echo Pushing to main branch...
git push origin main

echo Done! Vercel should redeploy automatically.
echo Check https://flowtaskenchanced.vercel.app in a few minutes.
pause
