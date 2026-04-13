@echo off
title Mi Fruteria - Compilar APK Android
color 0A
echo.
echo =====================================================
echo    MI FRUTERIA - Compilador de APK Android
echo =====================================================
echo.

:: Verificar que Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado.
    echo Descargalo de: https://nodejs.org
    pause
    exit /b
)

:: Moverse a la carpeta del proyecto
cd /d "%~dp0"
echo [1/4] Instalando dependencias del proyecto...
call npm install
echo.

:: Instalar EAS CLI globalmente
echo [2/4] Instalando EAS CLI...
call npm install -g eas-cli
echo.

:: Login en Expo
echo [3/4] Iniciando sesion en Expo...
echo Si no tienes cuenta, creala gratis en: https://expo.dev
echo.
call eas login
echo.

:: Compilar APK
echo [4/4] Compilando APK... (esto tarda ~15 minutos)
echo Al terminar recibiras un LINK para descargar el APK.
echo.
call eas build --platform android --profile preview

echo.
echo =====================================================
echo  Listo! Copia el link de arriba para bajar el APK.
echo  Luego mandalo por WhatsApp al otro celular.
echo =====================================================
echo.
pause
