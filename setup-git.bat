@echo off
echo ========================================
echo GIT SETUP FOR UET CARD PROJECT
echo ========================================
echo.

echo Please enter your GitHub details:
echo.

set /p username="Enter your GitHub username: "
set /p email="Enter your GitHub email: "

echo.
echo Setting up Git configuration...

git config --global user.name "%username%"
git config --global user.email "%email%"

echo.
echo Git configuration completed!
echo Username: %username%
echo Email: %email%

echo.
echo ========================================
echo Now ready to initialize repository!
echo ========================================
pause
