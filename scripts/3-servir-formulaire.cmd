@echo off
setlocal
chcp 65001 >nul
title PNDA - Matching Grant : serveur local

REM ===========================================================================
REM  Le formulaire DOIT etre servi en http:// et non ouvert en double-clic.
REM  En file:// le navigateur isole la page et bloque tout echange avec
REM  Supabase (envoi des fiches et des pieces jointes).
REM
REM  Ce script cherche un moteur disponible, dans l'ordre :
REM    1. python      2. py -3      3. PowerShell (toujours present)
REM ===========================================================================

cd /d "%~dp0.."
set "PORT=5173"

echo.
echo   ============================================================
echo    PNDA - Matching Grant : formulaire d'enregistrement
echo   ============================================================
echo.

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   Moteur : Python
    echo   Adresse: http://localhost:%PORT%
    echo   Arret  : Ctrl+C
    echo.
    start "" "http://localhost:%PORT%"
    cd web
    python -m http.server %PORT%
    goto :fin
)

py -3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   Moteur : Python ^(py -3^)
    echo   Adresse: http://localhost:%PORT%
    echo   Arret  : Ctrl+C
    echo.
    start "" "http://localhost:%PORT%"
    cd web
    py -3 -m http.server %PORT%
    goto :fin
)

echo   Python non detecte - bascule sur PowerShell.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serveur.ps1" -Port %PORT%

:fin
echo.
echo   Serveur arrete.
pause
