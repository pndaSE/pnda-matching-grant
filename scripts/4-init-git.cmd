@echo off
setlocal
chcp 65001 >nul
title PNDA - Matching Grant : initialisation du depot Git

REM ===========================================================================
REM  Prepare le depot local et le premier commit.
REM  La creation du depot GitHub et la poussee restent a votre main :
REM  elles demandent VOS identifiants, que ce script ne manipule jamais.
REM ===========================================================================

cd /d "%~dp0.."

git --version >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Git n'est pas installe. Telechargez-le sur https://git-scm.com/download/win
  echo   puis relancez ce script.
  pause
  exit /b 1
)

echo.
echo   ============================================================
echo    PNDA - Matching Grant : depot local
echo   ============================================================
echo.

if exist ".git" (
  echo   Depot deja initialise. Etat actuel :
  git status --short
) else (
  git init -b main
  git add .
  git -c user.name="PNDA" -c user.email="pnda@local" commit -m "Matching Grant : formulaire, console S&E, schema Supabase"
  echo.
  echo   Premier commit cree.
)

echo.
echo   ============================================================
echo    A FAIRE ENSUITE, depuis cette fenetre
echo   ============================================================
echo.
echo   1. Creez un depot PUBLIC sur https://github.com/new
echo      Nom suggere : pnda-matching-grant
echo      NE PAS cocher "Add a README" ni "Add .gitignore"
echo.
echo   2. Reliez et poussez ^(remplacez VOTRE-COMPTE^) :
echo.
echo        git remote add origin https://github.com/VOTRE-COMPTE/pnda-matching-grant.git
echo        git push -u origin main
echo.
echo   3. Depot ^> Settings ^> Pages ^> Source = "GitHub Actions"
echo.
echo   Les liens seront alors :
echo        Formulaire : https://VOTRE-COMPTE.github.io/pnda-matching-grant/
echo        Console    : https://VOTRE-COMPTE.github.io/pnda-matching-grant/admin.html
echo.
pause
