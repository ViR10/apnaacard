@echo off
echo ========================================
echo FILES THAT WILL BE UPLOADED TO GITHUB:
echo ========================================
echo.

echo ✅ Root Configuration Files:
dir /b *.json *.js *.toml .env.example .gitignore 2>nul
echo.

echo ✅ Source Code Folder (src/):
if exist src echo src/ folder exists - INCLUDE
echo.

echo ✅ Public Files Folder (public/):
if exist public echo public/ folder exists - INCLUDE (except user uploads)
echo.

echo ✅ Netlify Functions:
if exist netlify echo netlify/ folder exists - INCLUDE
echo.

echo ========================================
echo FILES THAT WILL BE EXCLUDED:
echo ========================================
echo.

echo ❌ Environment File:
if exist .env echo .env - EXCLUDED (contains sensitive data)

echo ❌ Node Modules:
if exist node_modules echo node_modules/ - EXCLUDED (auto-installed)

echo ❌ Build Cache:
if exist .netlify echo .netlify/ - EXCLUDED (local build files)

echo ❌ User Uploaded Images:
dir /b public\profile-*.* 2>nul && echo User profile images - EXCLUDED

echo.
echo ========================================
echo Ready for GitHub upload!
echo ========================================
pause
