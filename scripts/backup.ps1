param([string]$EnvFile = ".env.docker")

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

if (-not (Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" | Out-Null
}

Write-Host "Preparando la base de datos para el backup..."
docker compose -f compose.yaml --env-file $EnvFile up -d --no-deps --wait --wait-timeout 180 database
if ($LASTEXITCODE -ne 0) {
    throw "La base de datos no pudo quedar lista. Se cancelo el backup y la actualizacion. Revise los logs del servicio database."
}

$backupFile = "orden_fabricacion_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
docker compose -f compose.yaml --env-file $EnvFile exec -T -e "BACKUP_FILE=$backupFile" database sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" --routines --triggers --single-transaction orden_fabricacion > "/backups/$BACKUP_FILE"'

if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear el backup."
}

Write-Host "Backup creado en backups\$backupFile" -ForegroundColor Green
