param()
$ErrorActionPreference = 'Continue'

function Test-Command($cmd){ $null = Get-Command $cmd -ErrorAction SilentlyContinue; return $? }

Write-Host "Attempting to install dependencies (Python, uv)" -ForegroundColor Cyan

# Install Python
if (-not (Test-Command 'py') -and -not (Test-Command 'python') -and -not (Test-Command 'python3')) {
  if (Test-Command 'winget') {
    Write-Host "Installing Python via winget..." -ForegroundColor Yellow
    winget install -e --id Python.Python.3.12 -h --accept-package-agreements --accept-source-agreements
  } elseif (Test-Command 'choco') {
    Write-Host "Installing Python via Chocolatey..." -ForegroundColor Yellow
    choco install -y python
  } else {
    Write-Host "winget/choco not found. Please install Python manually from https://www.python.org/downloads/" -ForegroundColor Red
  }
}

# Refresh PATH for current session
$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User')

# Install uv
if (-not (Test-Command 'uv')) {
  Write-Host "Installing uv from official script..." -ForegroundColor Yellow
  try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -UseBasicParsing https://astral.sh/uv/install.ps1 -OutFile "$env:TEMP\\uv_install.ps1"
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:TEMP\\uv_install.ps1" -Force
  } catch {
    Write-Host "uv install failed: $_" -ForegroundColor Red
  }
}

Write-Host "Dependency installation steps completed." -ForegroundColor Green
exit 0

