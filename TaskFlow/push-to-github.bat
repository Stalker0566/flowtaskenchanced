@echo off
echo Adding remote origin...
git remote add origin https://github.com/Stalker0566/flowtaskenchanced.git

echo Pushing development branch...
git push -u origin development

echo Pushing master branch...
git push -u origin master

echo Done!
pause
