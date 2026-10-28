@echo off
title Hooligans Mobile App (Expo)

REM Add Node.js to PATH for current session
set PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm;C:\Program Files (x86)\nodejs

echo ========================================================
echo   Ekkinisi Hooligans Geo-Photos Mobile App (Expo)
echo ========================================================
echo.
npx expo start -c
pause
