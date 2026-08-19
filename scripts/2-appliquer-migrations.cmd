@echo off
REM ===========================================================================
REM  PNDA - Matching Grant : envoi des migrations vers la base distante
REM  Demande le mot de passe de la base (Project Settings > Database).
REM  Alternative sans CLI : copier/coller les fichiers supabase\migrations\*.sql
REM  dans le SQL Editor de Supabase, dans l'ordre des noms.
REM ===========================================================================
cd /d "%~dp0.."
echo.
echo Migrations a appliquer :
dir /b supabase\migrations
echo.
supabase db push
echo.
echo Verifiez ensuite avec supabase\verification.sql dans le SQL Editor.
pause
