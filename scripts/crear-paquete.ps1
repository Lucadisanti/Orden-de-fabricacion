param([string]$Version = "0.1.0", [string]$Destino = ".\entrega-cliente")

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory

$imagenes = @(
  @{ Nombre = "orden-fabricacion/backend:$Version"; Contexto = "backend" },
  @{ Nombre = "orden-fabricacion/frontend:$Version"; Contexto = "frontend" },
  @{ Nombre = "orden-fabricacion/database:$Version"; Contexto = "."; Dockerfile = "database/Dockerfile" }
)

New-Item -ItemType Directory -Force -Path "$Destino\imagenes", "$Destino\scripts", "$Destino\backups" | Out-Null
foreach ($imagen in $imagenes) {
  $argumentos = @("build", "-t", $imagen.Nombre)
  if ($imagen.Dockerfile) { $argumentos += @("-f", $imagen.Dockerfile) }
  $argumentos += $imagen.Contexto
  & docker @argumentos
  if ($LASTEXITCODE -ne 0) { throw "No se pudo construir $($imagen.Nombre)." }
  $archivo = "$Destino\imagenes\$($imagen.Nombre.Replace('/', '-').Replace(':', '-')).tar"
  docker save -o $archivo $imagen.Nombre
}

Copy-Item compose.cliente.yaml "$Destino\compose.yaml"
Copy-Item .env.cliente.example "$Destino\.env.cliente.example"
Copy-Item scripts\iniciar-paquete.ps1, scripts\detener.ps1, scripts\backup.ps1, scripts\actualizar-paquete.ps1 "$Destino\scripts"
Write-Host "Paquete creado en $Destino" -ForegroundColor Green
