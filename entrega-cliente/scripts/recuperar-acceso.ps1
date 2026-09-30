$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectDirectory ".env.cliente"
$scriptFile = Join-Path $PSScriptRoot "recuperar-admin.py"

if (-not (Test-Path -LiteralPath $envFile)) {
  throw "No se encontro .env.cliente. Inicie el sistema al menos una vez antes de recuperar el acceso."
}

$username = Read-Host "Usuario maestro (Enter para Admin)"
if ([string]::IsNullOrWhiteSpace($username)) { $username = "Admin" }
$username = $username.Trim()

Set-Location -LiteralPath $projectDirectory
Get-Content -LiteralPath $scriptFile -Raw | docker compose -f compose.yaml --env-file .env.cliente exec -T backend python - $username
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo recuperar el acceso. Compruebe que Docker y el sistema esten iniciados."
}
