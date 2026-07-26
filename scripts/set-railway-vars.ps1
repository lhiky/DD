#!/usr/bin/env pwsh
"# Railway env var setter\n# Reads keys from .env.example and sets variables in Railway using the Railway CLI.\n# It prefers values from a local .env file if present, otherwise prompts you to enter them.\n" | Out-File -Encoding utf8 scripts\README.txt

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
if (-not $railwayCmd) {
    Write-Error "Railway CLI not found. Install it and run 'railway login' first."
    exit 1
}

foreach ($k in $defaults.Keys) {
    $exampleVal = $defaults[$k]
    $prefilled = $null
    if ($local.ContainsKey($k) -and $local[$k]) { $prefilled = $local[$k] }
    elseif ($env:$k) { $prefilled = $env:$k }

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
    railway variables set $k "$value"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to set variable $k"
    }
}

Write-Host "Done. Review variables in the Railway dashboard or run 'railway variables list'."
