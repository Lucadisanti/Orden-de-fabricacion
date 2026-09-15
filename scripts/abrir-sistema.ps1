$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

$envFile = Join-Path $projectDirectory ".env.cliente"
if (-not (Test-Path -LiteralPath $envFile)) {
  & "$PSScriptRoot\iniciar-paquete.ps1"
  Write-Host "Complete las contrasenas en .env.cliente y vuelva a abrir el sistema." -ForegroundColor Yellow
  exit 0
}

$backendArchive = Get-ChildItem -LiteralPath (Join-Path $projectDirectory "imagenes") -Filter "orden-fabricacion-backend-*.tar" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
if (-not $backendArchive -or $backendArchive.Name -notmatch '^orden-fabricacion-backend-(.+)\.tar$') {
  throw "No se encontro una imagen de backend valida en imagenes."
}

$availableVersion = $Matches[1]
$installedImage = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^ORDEN_BACKEND_IMAGE=' } | Select-Object -First 1
$installedVersion = if ($installedImage -match ':(.+)$') { $Matches[1] } else { "" }

if ($availableVersion -ne $installedVersion) {
  & "$PSScriptRoot\actualizar-paquete.ps1"
  if ($LASTEXITCODE -ne 0) { throw "No se pudo actualizar el sistema." }
} else {
  docker compose -f compose.yaml --env-file .env.cliente up -d
  if ($LASTEXITCODE -ne 0) { throw "No se pudo iniciar el sistema." }
}

$portLine = Get-Content $envFile | Where-Object { $_ -match '^APP_PORT=' } | Select-Object -First 1
$appPort = if ($portLine) { ($portLine -split '=', 2)[1].Trim() } else { "8080" }
Start-Process "http://localhost:$appPort"
