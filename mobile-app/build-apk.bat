@echo off
title Hooligans Geo-Photos - Build Standalone Android APK
cd /d "%~dp0"

REM Add Node.js to PATH
set PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm;C:\Program Files (x86)\nodejs

echo ===================================================================
echo   HOOLIGANS GEO-PHOTOS - BUILD STANDALONE ANDROID APK
echo ===================================================================
echo.
echo [1/3] Checking Expo connection...
echo.

call npx.cmd -y eas-cli whoami
if %ERRORLEVEL% EQU 0 goto :LOGGED_IN

echo.
echo ---------------------------------------------------------------
echo Parakalo syndetheite me to Expo account sas.
echo ---------------------------------------------------------------
echo.
call npx.cmd -y eas-cli login
if %ERRORLEVEL% NEQ 0 goto :LOGIN_FAILED

:LOGGED_IN
echo.
echo ===================================================================
echo [2/3] Ekkinisi Cloud APK Build...
echo.
echo - An sas rotisei gia Android Keystore: patiste Enter (Yes).
echo - Sto TELOS otan sas rotisei:
echo   "Install and run the Android build on an emulator?"
echo   -> PATISTE: NO (n) [epeidi to theloume gia to kinito mas!]
echo ===================================================================
echo.

call npx.cmd -y eas-cli build -p android --profile preview
if %ERRORLEVEL% NEQ 0 goto :BUILD_FAILED

echo.
echo ===================================================================
echo [3/3] To Build oloklirothike epitichos!
echo Skanarete to QR code i anoixte to link sto Android kinito sas
echo gia na katevasete kai na egkatastisete to Hooligans Map APK!
echo ===================================================================
echo.
goto :END

:LOGIN_FAILED
echo.
echo [!] H syndesi sto Expo apetiyche i akyrothike.
echo.
goto :END

:BUILD_FAILED
echo.
echo [!] To Build apetiyche. Parakalo elenxte ta minimata parapano.
echo.
goto :END

:END
pause
