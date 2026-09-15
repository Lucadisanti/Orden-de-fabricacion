param([string]$EnvFile = ".env.cliente")

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

docker compose -f compose.yaml --env-file $EnvFile down
Write-Host "Sistema detenido. Los datos permanecen guardados." -ForegroundColor Green
