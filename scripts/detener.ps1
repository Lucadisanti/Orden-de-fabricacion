param([string]$EnvFile = ".env.docker")

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

docker compose --env-file $EnvFile down
Write-Host "Sistema detenido. Los datos permanecen guardados." -ForegroundColor Green
