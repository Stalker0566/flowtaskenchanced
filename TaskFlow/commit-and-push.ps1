Write-Host "Adding all files..." -ForegroundColor Green
git add .

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "Fix task deletion: remove confirmation modal and add compact undo notification"

Write-Host "Pushing to main branch..." -ForegroundColor Green
git push origin main

Write-Host "Done!" -ForegroundColor Green
Read-Host "Press Enter to continue"
