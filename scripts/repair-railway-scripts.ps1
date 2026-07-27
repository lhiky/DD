$repoRoot = Resolve-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) | Select-Object -ExpandProperty Path

$deployPath = Join-Path $repoRoot 'scripts\railway-deploy.ps1'
$setVarsPath = Join-Path $repoRoot 'scripts\set-railway-vars.ps1'

$deployContent = @'
# Railway deployment helper
# This script installs dependencies, builds the app, syncs environment variables to Railway, and deploys the service.

param(
  [switch]$SkipBuild
)

$repoRoot = Resolve-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) | Select-Object -ExpandProperty Path
Set-Location $repoRoot

$railwayCmd = Get-Command railway -ErrorAction SilentlyContinue
if ($railwayCmd) {
  Write-Host "Using global Railway CLI."
  $railwayExe = 'railway'
  $railwayArgs = @()
} else {
  Write-Host "Global Railway CLI not found; using local npx railway instead."
  $railwayExe = 'npx'
  $railwayArgs = @('railway')
}

if (-not (Test-Path '.env')) {
  Write-Host "No .env found. Copying .env.example to .env as a starting point."
  Copy-Item '.\.env.example' '.env' -Force
  Write-Host "A .env file was created. Update it with your secrets, then rerun this script."
}

if (-not $SkipBuild) {
  Write-Host "Installing dependencies..."
  npm ci

  Write-Host "Building application..."
  npm run build
}

Write-Host "Syncing environment variables to Railway..."
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-railway-vars.ps1 -Force
if ($LASTEXITCODE -ne 0) {
  Write-Error "Railway environment variable sync failed. Fix any errors above and rerun this script."
  exit $LASTEXITCODE
}

Write-Host "Deploying to Railway..."
& $railwayExe @($railwayArgs + 'up' + '--detach')
if ($LASTEXITCODE -ne 0) {
  Write-Error "Railway deployment failed. Check the Railway CLI output for details."
  exit $LASTEXITCODE
}

Write-Host "Railway deployment complete. Review the Railway dashboard for your service URL and logs."
'@

$setVarsContent = @'
#!/usr/bin/env pwsh
"# Railway env var setter
# Reads keys from .env.example and sets variables in Railway using the Railway CLI.
# It prefers values from a local .env file if present, otherwise prompts you to enter them.
" | Out-File -Encoding utf8 scripts\README.txt

param(
  [switch]$Force
)

function Parse-EnvFile($path) {
  $result = @{}
  if (-not (Test-Path $path)) { return $result }
  foreach ($line in Get-Content $path) {
    if ($line -match '^[\s#]*$' -or $line -match '^[\s]*#') { continue }
    $parts = $line -split '=',2
    if ($parts.Count -ge 1) {
      $key = $parts[0].Trim()
      $val = ''
      if ($parts.Count -eq 2) { $val = $parts[1].Trim() }
      $result[$key] = $val
    }
  }
  return $result
}

$repoRoot = Resolve-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) | Select-Object -ExpandProperty Path
Set-Location $repoRoot

$envExample = Join-Path $repoRoot '.env.example'
if (-not (Test-Path $envExample)) {
  Write-Error "Cannot find .env.example in $repoRoot"
  exit 1
}

$envFile = Join-Path $repoRoot '.env'
$defaults = Parse-EnvFile $envExample
$local = Parse-EnvFile $envFile

$railwayCmd = Get-Command railway -ErrorAction SilentlyContinue
if ($railwayCmd) {
  $railwayExe = 'railway'
  $railwayArgs = @()
} else {
  Write-Host "Global Railway CLI not found; using local npx railway instead."
  $railwayExe = 'npx'
  $railwayArgs = @('railway')
}

foreach ($k in $defaults.Keys) {
  $prefilled = $null
  if ($local.ContainsKey($k) -and $local[$k]) {
    $prefilled = $local[$k]
  } else {
    $envItem = Get-Item -Path "env:$k" -ErrorAction SilentlyContinue
    if ($envItem) { $prefilled = $envItem.Value }
  }

  if (-not $Force) {
    if ($prefilled) {
      Write-Host "Using value from .env for $k"
      $value = $prefilled
    } else {
      $prompt = "Enter value for $k (leave blank to skip)"
      $value = Read-Host $prompt
    }
  } else {
    $value = $prefilled
  }

  if ([string]::IsNullOrEmpty($value)) {
    Write-Host "Skipping $k (no value provided)"
    continue
  }

  Write-Host "Setting Railway variable: $k"
  & $railwayExe @($railwayArgs + 'variables' + 'set' + $k + $value)
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to set variable $k"
  }
}

Write-Host "Done. Review variables in the Railway dashboard or run 'railway variables list'."
'@

Set-Content -Path $deployPath -Value $deployContent -Encoding UTF8
Set-Content -Path $setVarsPath -Value $setVarsContent -Encoding UTF8
Write-Host "Railway helper scripts restored."
