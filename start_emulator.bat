@echo off
echo ========================================
echo  Iniciando Firebase Firestore Emulator
echo ========================================
echo.
echo Projeto: profissional-os-app
echo Emulador Firestore: localhost:8080
echo UI do Emulador: http://localhost:4000
echo.
echo Pressione Ctrl+C para parar.
echo.

set FIRESTORE_EMULATOR_HOST=localhost:8080
set FIREBASE_PROJECT_ID=profissional-os-app

firebase emulators:start --only firestore --project profissional-os-app
