param([string]$EnvFile = ".env.docker")

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

if (-not (Test-Path $EnvFile)) {
    Copy-Item ".env.docker.example" ".env.docker"
    Write-Host "Se creo .env.docker. Cambie las contrasenas antes del primer inicio." -ForegroundColor Yellow
    exit 1
}

docker compose --env-file $EnvFile up -d --build

$portLine = Get-Content $EnvFile | Where-Object { $_ -match '^APP_PORT=' } | Select-Object -First 1
$appPort = if ($portLine) { ($portLine -split '=', 2)[1].Trim() } else { "8080" }

Write-Host "Sistema iniciado en http://localhost:$appPort" -ForegroundColor Green
