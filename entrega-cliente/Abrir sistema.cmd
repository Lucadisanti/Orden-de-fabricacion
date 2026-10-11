@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\abrir-sistema.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo abrir el sistema. Copie el mensaje de arriba para revisar el error.
  pause
  exit /b 1
)
