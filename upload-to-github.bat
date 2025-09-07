@echo off
echo ========================================
echo UPLOADING UET CARD PROJECT TO GITHUB
echo ========================================
echo.

echo Please make sure you have:
echo 1. ✅ Installed Git from https://git-scm.com/downloads
echo 2. ✅ Created a GitHub repository named 'uet-card-system'
echo 3. ✅ Run setup-git.bat to configure your Git settings
echo.

set /p ready="Are you ready to proceed? (y/n): "
if /i "%ready%" neq "y" goto :end

echo.
echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding all files to Git...
git add .

echo.
echo Step 3: Creating initial commit...
git commit -m "Initial commit - UET Card Management System ready for deployment"

echo.
echo Step 4: Setting up GitHub connection...
set /p github_username="Enter your GitHub username: "

git remote add origin https://github.com/%github_username%/uet-card-system.git

echo.
echo Step 5: Setting main branch...
git branch -M main

echo.
echo Step 6: Uploading to GitHub...
echo (You may be prompted for your GitHub password)
git push -u origin main

echo.
echo ========================================
echo ✅ SUCCESS! Your project is now on GitHub!
echo ========================================
echo.
echo Your repository URL:
echo https://github.com/%github_username%/uet-card-system
echo.
echo Next steps:
echo 1. Go to https://netlify.com
echo 2. Connect your GitHub repository
echo 3. Deploy your application
echo.

:end
pause
