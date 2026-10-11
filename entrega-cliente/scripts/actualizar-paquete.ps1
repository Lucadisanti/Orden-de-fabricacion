param(
  [string]$EnvFile = ".env.cliente",
  [string]$ReleaseDirectory = ".\imagenes"
)

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

$envPath = Join-Path $projectDirectory $EnvFile
$imagesPath = Join-Path $projectDirectory $ReleaseDirectory
if (-not (Test-Path -LiteralPath $envPath)) {
  throw "No se encontro $EnvFile. Ejecute primero scripts\iniciar-paquete.ps1."
}

$backendArchive = Get-ChildItem -LiteralPath $imagesPath -Filter "orden-fabricacion-backend-*.tar" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
if (-not $backendArchive -or $backendArchive.Name -notmatch '^orden-fabricacion-backend-(.+)\.tar$') {
  throw "No se encontro una imagen de backend valida en imagenes."
}

$version = $Matches[1]
$requiredArchives = @(
  "orden-fabricacion-backend-$version.tar",
  "orden-fabricacion-frontend-$version.tar",
  "orden-fabricacion-database-$version.tar"
)
foreach ($archive in $requiredArchives) {
  if (-not (Test-Path -LiteralPath (Join-Path $imagesPath $archive))) {
    throw "Falta $archive en la carpeta imagenes."
  }
}

& "$PSScriptRoot\backup.ps1" -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) { throw "Se canceló la actualización porque falló el backup." }

Get-ChildItem -LiteralPath $ReleaseDirectory -Filter "*.tar" | ForEach-Object { docker load -i $_.FullName }
if ($LASTEXITCODE -ne 0) { throw "No se pudieron cargar las imágenes de actualización." }

$envContent = Get-Content -LiteralPath $envPath
$envContent = $envContent -replace '^ORDEN_DATABASE_IMAGE=.*$', "ORDEN_DATABASE_IMAGE=orden-fabricacion/database:$version"
$envContent = $envContent -replace '^ORDEN_BACKEND_IMAGE=.*$', "ORDEN_BACKEND_IMAGE=orden-fabricacion/backend:$version"
$envContent = $envContent -replace '^ORDEN_FRONTEND_IMAGE=.*$', "ORDEN_FRONTEND_IMAGE=orden-fabricacion/frontend:$version"
Set-Content -LiteralPath $envPath -Value $envContent -Encoding UTF8

docker compose -f compose.yaml --env-file $EnvFile up -d
if ($LASTEXITCODE -ne 0) { throw "La actualización no pudo completarse." }

Write-Host "Sistema actualizado. Los datos existentes fueron conservados." -ForegroundColor Green
