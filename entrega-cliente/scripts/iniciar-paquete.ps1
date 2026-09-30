param([string]$EnvFile = ".env.cliente")

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

if (-not (Test-Path $EnvFile)) {
  Copy-Item ".env.cliente.example" $EnvFile
  Write-Host "Se creó .env.cliente. Completá las contraseñas antes del primer inicio." -ForegroundColor Yellow
  exit 1
}

Get-ChildItem -LiteralPath ".\imagenes" -Filter "*.tar" | ForEach-Object {
  docker load -i $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "No se pudo cargar la imagen $($_.Name)." }
}
docker compose -f compose.yaml --env-file $EnvFile up -d
if ($LASTEXITCODE -ne 0) { throw "No se pudo iniciar el sistema." }
