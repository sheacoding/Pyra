param()
$ErrorActionPreference = 'SilentlyContinue'

function Test-Command($cmd){
  $null = Get-Command $cmd -ErrorAction SilentlyContinue
  return $?
}

$hasPython = (Test-Command 'py') -or (Test-Command 'python') -or (Test-Command 'python3')
$hasUv = (Test-Command 'uv')

if ($hasPython -and $hasUv) {
  Write-Output "Python and uv present"
  exit 0
}

if (-not $hasPython) { Write-Output "Python missing" }
if (-not $hasUv) { Write-Output "uv missing" }
exit 1

