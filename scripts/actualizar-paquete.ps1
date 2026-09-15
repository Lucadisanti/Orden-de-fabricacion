param(
  [string]$EnvFile = ".env.cliente",
  [string]$ReleaseDirectory = ".\imagenes"
)

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

& "$PSScriptRoot\backup.ps1" -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) { throw "Se canceló la actualización porque falló el backup." }

Get-ChildItem -LiteralPath $ReleaseDirectory -Filter "*.tar" | ForEach-Object { docker load -i $_.FullName }
if ($LASTEXITCODE -ne 0) { throw "No se pudieron cargar las imágenes de actualización." }

docker compose -f compose.yaml --env-file $EnvFile up -d
if ($LASTEXITCODE -ne 0) { throw "La actualización no pudo completarse." }

Write-Host "Sistema actualizado. Los datos existentes fueron conservados." -ForegroundColor Green
