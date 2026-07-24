$ErrorActionPreference = 'Stop'

# The script can be placed either in the repository root or launched while
# PowerShell is opened in the repository root.
$scriptRoot = $PSScriptRoot
$currentRoot = (Get-Location).Path

$scriptCandidate = Join-Path $scriptRoot 'src\components\app-shell.tsx'
$currentCandidate = Join-Path $currentRoot 'src\components\app-shell.tsx'

if (Test-Path $scriptCandidate) {
  $repoRoot = $scriptRoot
  $appShellPath = $scriptCandidate
}
elseif (Test-Path $currentCandidate) {
  $repoRoot = $currentRoot
  $appShellPath = $currentCandidate
}
else {
  throw 'src/components/app-shell.tsx was not found. Copy the presentation package contents into the nct-navigator-front repository root, then run this script there.'
}

$content = Get-Content -Raw -Encoding UTF8 -Path $appShellPath

if ($content.Contains('pathname === "/presentation"')) {
  Write-Host 'AppShell already supports /presentation. No patch is needed.' -ForegroundColor Yellow
  exit 0
}

$needle = '  if (!isServerAvailable) {'

if (-not $content.Contains($needle)) {
  throw 'Insertion point was not found. Open INSTALL.md and apply the AppShell patch manually.'
}

$replacement = @'
  if (pathname === "/presentation") {
    return <>{children}</>;
  }

  if (!isServerAvailable) {
'@

$content = $content.Replace($needle, $replacement)
Set-Content -Path $appShellPath -Value $content -Encoding UTF8

Write-Host 'Done: /presentation now bypasses the standard AppShell.' -ForegroundColor Green
Write-Host 'Next commands: npm run lint; npm run build' -ForegroundColor Cyan