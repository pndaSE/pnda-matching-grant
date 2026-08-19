@echo off
REM ===========================================================================
REM  PNDA - Matching Grant : liaison du dossier au projet Supabase distant
REM  Prerequis : Supabase CLI installe (scoop install supabase / npm i -g supabase)
REM ===========================================================================
cd /d "%~dp0.."
echo.
echo [1/3] Connexion a votre compte Supabase (ouvre le navigateur)...
supabase login
echo.
echo [2/3] Initialisation locale (ignore si deja fait)...
if not exist "supabase\.temp" supabase init --workdir . 2>nul
echo.
echo [3/3] Liaison au projet splqfwjlndatyvuhycyu...
supabase link --project-ref splqfwjlndatyvuhycyu
echo.
echo Termine. Lancez ensuite 2-appliquer-migrations.cmd
pause
