@echo off
setlocal
chcp 65001 >nul
title PNDA - Corriger l'identite GitHub

REM ===========================================================================
REM  « Permission to pndaSE/... denied to KISUNGU » = mauvaise identite.
REM  Windows a memorise les identifiants d'un compte GitHub ; Git les reutilise
REM  pour tous les depots, y compris ceux d'un autre compte.
REM
REM  Ce script diagnostique et propose d'oublier l'identifiant memorise.
REM  Il ne demande, ne lit et n'enregistre aucun mot de passe.
REM ===========================================================================

cd /d "%~dp0.."

echo.
echo   ============================================================
echo    DIAGNOSTIC
echo   ============================================================
echo.
echo   Depot distant configure :
git remote -v
echo.
echo   Identifiants GitHub memorises par Windows :
cmdkey /list | findstr /i github
if errorlevel 1 echo     ^(aucun^)
echo.

echo   ============================================================
echo    CORRECTION
echo   ============================================================
echo.
echo   Pour pousser en tant que pndaSE, Windows doit oublier
echo   l'identifiant actuel afin que GitHub vous redemande de vous
echo   connecter. Aucun mot de passe n'est lu ni conserve ici.
echo.
set /p REP=  Oublier l'identifiant GitHub memorise ? (o/N) : 
if /i not "%REP%"=="o" goto :suite

cmdkey /delete:git:https://github.com >nul 2>&1
cmdkey /delete:LegacyGeneric:target=git:https://github.com >nul 2>&1
echo.
echo   Identifiant oublie.

:suite
echo.
echo   L'adresse du depot va porter le nom du compte, pour que GitHub
echo   cible directement pndaSE :
echo.
git remote set-url origin https://pndaSE@github.com/pndaSE/pnda-matching-grant.git
git remote -v
echo.
echo   ============================================================
echo    A FAIRE MAINTENANT
echo   ============================================================
echo.
echo   1. Dans votre navigateur, deconnectez-vous de github.com si vous
echo      y etes connecte comme KISUNGU ^(sinon la fenetre de connexion
echo      reutilisera cette session sans rien demander^).
echo.
echo   2. Lancez :   git push -u origin main
echo      Une fenetre s'ouvre : connectez-vous comme pndaSE.
echo.
echo   3. Depot ^> Settings ^> Pages ^> Source = "GitHub Actions"
echo.
echo   Liens finaux :
echo      Formulaire : https://pndase.github.io/pnda-matching-grant/
echo      Console    : https://pndase.github.io/pnda-matching-grant/admin.html
echo.
pause
