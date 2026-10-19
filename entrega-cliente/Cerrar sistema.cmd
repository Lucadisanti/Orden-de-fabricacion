@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\detener.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo cerrar el sistema. Revise el mensaje anterior.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
