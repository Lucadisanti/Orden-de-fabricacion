$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

& "$PSScriptRoot\actualizar-paquete.ps1"
if ($LASTEXITCODE -ne 0) { throw "No se pudo iniciar el sistema." }

$envFile = Join-Path $projectDirectory ".env.cliente"
$portLine = Get-Content $envFile | Where-Object { $_ -match '^APP_PORT=' } | Select-Object -First 1
$appPort = if ($portLine) { ($portLine -split '=', 2)[1].Trim() } else { "8080" }
Start-Process "http://localhost:$appPort"
