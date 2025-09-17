param()
$ErrorActionPreference = 'Continue'

function Test-Command($cmd){ $null = Get-Command $cmd -ErrorAction SilentlyContinue; return $? }

function Ensure-Winget {
  if (Test-Command 'winget') { return $true }
  Write-Host "winget not found. Attempting official install (App Installer)." -ForegroundColor Yellow
  try {
    $tmp = Join-Path $env:TEMP "AppInstaller.msixbundle"
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -UseBasicParsing -Uri "https://aka.ms/getwinget" -OutFile $tmp
    # Try to install. This may require dependencies on older systems.
    Add-AppxPackage -Path $tmp -ErrorAction Stop
  } catch {
    Write-Host "Failed to install winget via App Installer bundle: $_" -ForegroundColor Red
  }
  return (Test-Command 'winget')
}

function Ensure-Choco {
  if (Test-Command 'choco') { return $true }
  Write-Host "Chocolatey not found. Attempting official installation..." -ForegroundColor Yellow
  try {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
  } catch {
    Write-Host "Chocolatey install failed: $_" -ForegroundColor Red
  }
  return (Test-Command 'choco')
}

function Ensure-PackageManagers {
  if (Ensure-Winget) { return 'winget' }
  if (Ensure-Choco) { return 'choco' }
  return $null
}

Write-Host "Attempting to install dependencies (Python, uv)" -ForegroundColor Cyan

$pm = Ensure-PackageManagers
if (-not $pm) {
  Write-Host "No package manager available (winget/choco). Please install Python manually from https://www.python.org/downloads/" -ForegroundColor Red
}

# Install Python
if (-not (Test-Command 'py') -and -not (Test-Command 'python') -and -not (Test-Command 'python3')) {
  if ($pm -eq 'winget') {
    Write-Host "Installing Python via winget..." -ForegroundColor Yellow
    winget install -e --id Python.Python.3.12 -h --accept-package-agreements --accept-source-agreements
  } elseif ($pm -eq 'choco') {
    Write-Host "Installing Python via Chocolatey..." -ForegroundColor Yellow
    choco install -y python
  }
}

# Refresh PATH for current session
$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User')

# Install uv
if (-not (Test-Command 'uv')) {
  Write-Host "Installing uv from official script..." -ForegroundColor Yellow
  try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -UseBasicParsing https://astral.sh/uv/install.ps1 -OutFile "$env:TEMP\uv_install.ps1"
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:TEMP\uv_install.ps1" -Force
  } catch {
    Write-Host "uv install failed: $_" -ForegroundColor Red
  }
}

Write-Host "Dependency installation steps completed." -ForegroundColor Green
exit 0
