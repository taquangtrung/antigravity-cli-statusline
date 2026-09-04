# Antigravity CLI Statusline Installer (Windows PowerShell)
$ErrorActionPreference = 'Stop'

function Write-Info($msg) {
    Write-Host "[info] $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "[ok] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "[warn] $msg" -ForegroundColor Yellow
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warn "Node.js is required to install and run the Antigravity CLI statusline."
    exit 1
}

Write-Info "Running statusline installer..."
node "$PSScriptRoot\install.js"
Write-Success "Installation complete!"
