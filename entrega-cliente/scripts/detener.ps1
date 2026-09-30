param([string]$EnvFile = ".env.cliente")

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

$envPath = Join-Path $projectDirectory $EnvFile
if (-not (Test-Path -LiteralPath $envPath)) {
  throw "No se encontro $EnvFile. Abra primero el sistema para completar la instalacion."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker Desktop no esta instalado o Docker no esta disponible."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker Desktop no esta iniciado. Abralo y vuelva a intentar."
}

docker compose -f compose.yaml --env-file $envPath down
if ($LASTEXITCODE -ne 0) {
  throw "Docker no pudo detener el sistema."
}

Write-Host "Sistema detenido. Todos los datos permanecen guardados." -ForegroundColor Green
