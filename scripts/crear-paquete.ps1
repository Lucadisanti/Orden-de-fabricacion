param(
  [ValidatePattern('^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$')]
  [string]$Version = "0.2.1",
  [string]$Destino = ".\entrega-cliente"
)

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location $projectDirectory
$templateDirectory = Join-Path $projectDirectory "entrega-cliente"
if ([System.IO.Path]::IsPathRooted($Destino)) {
  $destinationDirectory = [System.IO.Path]::GetFullPath($Destino)
} else {
  $destinationDirectory = [System.IO.Path]::GetFullPath((Join-Path $projectDirectory $Destino))
}

docker info *> $null
if ($LASTEXITCODE -ne 0) { throw "Inicie Docker Desktop antes de generar el paquete." }

$imagenes = @(
  @{ Nombre = "orden-fabricacion/backend:$Version"; Contexto = "backend" },
  @{ Nombre = "orden-fabricacion/frontend:$Version"; Contexto = "frontend" },
  @{ Nombre = "orden-fabricacion/database:$Version"; Contexto = "."; Dockerfile = "database/Dockerfile" }
)

New-Item -ItemType Directory -Force -Path "$destinationDirectory\imagenes", "$destinationDirectory\scripts", "$destinationDirectory\backups" | Out-Null
foreach ($imagen in $imagenes) {
  $argumentos = @("build", "-t", $imagen.Nombre)
  if ($imagen.Dockerfile) { $argumentos += @("-f", $imagen.Dockerfile) }
  $argumentos += $imagen.Contexto
  & docker @argumentos
  if ($LASTEXITCODE -ne 0) { throw "No se pudo construir $($imagen.Nombre)." }
  $archivo = Join-Path $destinationDirectory "imagenes\$($imagen.Nombre.Replace('/', '-').Replace(':', '-')).tar"
  docker save -o $archivo $imagen.Nombre
  if ($LASTEXITCODE -ne 0) { throw "No se pudo exportar $($imagen.Nombre)." }
}

if ($destinationDirectory.TrimEnd('\') -ne $templateDirectory.TrimEnd('\')) {
  foreach ($file in @('compose.yaml', '.env.cliente.example', 'Abrir sistema.cmd', 'Cerrar sistema.cmd', 'Recuperar acceso administrador.cmd', 'RECUPERAR_ACCESO.md', 'LEEME.md')) {
    Copy-Item -LiteralPath (Join-Path $templateDirectory $file) -Destination $destinationDirectory
  }
  Get-ChildItem -LiteralPath (Join-Path $templateDirectory 'scripts') -File |
    Where-Object { $_.Extension -in @('.ps1', '.py') } |
    Copy-Item -Destination (Join-Path $destinationDirectory 'scripts')
}

# Solo cambia el ejemplo: una instalacion existente conserva claves, puerto y volumen.
$examplePath = Join-Path $destinationDirectory '.env.cliente.example'
$example = [System.IO.File]::ReadAllText($examplePath)
$example = $example -replace '(?m)^(ORDEN_(?:DATABASE|BACKEND|FRONTEND)_IMAGE=orden-fabricacion/[^:\r\n]+):[^\r\n]+', "`${1}:$Version"
[System.IO.File]::WriteAllText($examplePath, $example, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Paquete $Version listo en $destinationDirectory. Copie esa carpeta completa a la otra PC con Docker Desktop." -ForegroundColor Green
