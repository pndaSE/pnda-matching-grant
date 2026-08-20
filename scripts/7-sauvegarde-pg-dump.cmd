@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title PNDA - Sauvegarde complete de la base

REM ===========================================================================
REM  SAUVEGARDE COMPLETE — la seule qui permette une reprise apres incident.
REM
REM  Le clone telecharge depuis la console ne contient que les donnees que
REM  votre compte a le droit de lire, et rien du systeme. pg_dump, lui, copie
REM  tout : schema, donnees, index, contraintes, politiques RLS, declencheurs,
REM  fonctions, sequences, et les comptes Supabase Auth.
REM
REM  Le mot de passe est demande par pg_dump lui-meme. Ce script ne le lit pas,
REM  ne l'affiche pas et ne l'enregistre nulle part.
REM ===========================================================================

cd /d "%~dp0.."

set "REF=splqfwjlndatyvuhycyu"
set "HOTE=db.%REF%.supabase.co"
set "DOSSIER=sauvegardes"

where pg_dump >nul 2>&1
if errorlevel 1 (
  echo.
  echo   pg_dump est introuvable.
  echo.
  echo   Il est fourni avec PostgreSQL : https://www.postgresql.org/download/windows/
  echo   Pendant l'installation, il suffit de cocher "Command Line Tools".
  echo   Ajoutez ensuite le dossier bin de PostgreSQL au PATH.
  echo.
  echo   Solution de repli sans rien installer :
  echo     Supabase ^> Database ^> Backups ^> Download
  echo.
  pause
  exit /b 1
)

if not exist "%DOSSIER%" mkdir "%DOSSIER%"

REM Horodatage AAAAMMJJ-HHMM, independant du format regional
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "DT=%%I"
set "STAMP=%DT:~0,8%-%DT:~8,4%"
set "FICHIER=%DOSSIER%\pnda_matching_grant_%STAMP%.dump"

echo.
echo   ============================================================
echo    Sauvegarde complete de %REF%
echo   ============================================================
echo.
echo   Destination : %FICHIER%
echo   Format      : archive personnalisee ^(-Fc^), restaurable avec pg_restore
echo.
echo   pg_dump va demander le mot de passe de la base.
echo   Il se trouve dans Supabase ^> Project Settings ^> Database.
echo.

pg_dump -h "%HOTE%" -p 5432 -U postgres -d postgres ^
        -Fc --no-owner --no-privileges ^
        -f "%FICHIER%"

if errorlevel 1 (
  echo.
  echo   La sauvegarde a echoue.
  echo.
  echo   Causes frequentes :
  echo     - mot de passe incorrect
  echo     - projet Supabase en pause ^(le reveiller dans le tableau de bord^)
  echo     - connexion directe bloquee : essayez le pooler, port 6543
  echo.
  pause
  exit /b 1
)

for %%F in ("%FICHIER%") do set "TAILLE=%%~zF"
set /a "MO=%TAILLE% / 1048576"
echo.
echo   Sauvegarde terminee : %FICHIER% ^(%MO% Mo^)
echo.
echo   Pour restaurer dans un AUTRE projet :
echo     pg_restore -h db.AUTRE-REF.supabase.co -U postgres -d postgres ^^
echo                --no-owner --no-privileges "%FICHIER%"
echo.
echo   Conservez ces fichiers hors du depot Git : ils contiennent les donnees
echo   personnelles des beneficiaires. Le dossier sauvegardes\ est deja ignore.
echo.
pause
