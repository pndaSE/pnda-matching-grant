@echo off
setlocal
chcp 65001 >nul
title PNDA - Deploiement de l'Edge Function creer-agent

REM ===========================================================================
REM  Deploie la fonction qui cree les comptes agents.
REM  La cle service_role reste chez Supabase : elle n'apparait ni dans le
REM  navigateur, ni dans le depot GitHub.
REM ===========================================================================

cd /d "%~dp0.."

supabase --version >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Supabase CLI absente. Installez-la ^(npm i -g supabase^) ou deployez
  echo   la fonction depuis le tableau de bord Supabase ^> Edge Functions.
  pause
  exit /b 1
)

echo.
echo   Deploiement de creer-agent vers splqfwjlndatyvuhycyu...
echo.
supabase functions deploy creer-agent --project-ref splqfwjlndatyvuhycyu

echo.
echo   Ensuite, autorisez l'origine du site publie :
echo     supabase secrets set ORIGINE_PUBLIQUE=https://VOTRE-COMPTE.github.io --project-ref splqfwjlndatyvuhycyu
echo.
pause
