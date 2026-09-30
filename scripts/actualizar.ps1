param([string]$EnvFile = ".env.docker")

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

& "$PSScriptRoot\backup.ps1" -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) {
    throw "Se cancelo la actualizacion porque fallo el backup."
}

docker compose --env-file $EnvFile up -d --build
if ($LASTEXITCODE -ne 0) {
    throw "La actualizacion no pudo completarse."
}

Write-Host "Sistema actualizado. Los datos existentes fueron conservados." -ForegroundColor Green
