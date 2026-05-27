# Image Genius — PowerShell launcher
# Usage:
#   .\cli.ps1                       Interactive mode
#   .\cli.ps1 "一碗拉面"            One-shot generate
#   .\cli.ps1 regenerate
#   .\cli.ps1 refine output\foo.png
#   .\cli.ps1 init
#   .\cli.ps1 doctor

$ErrorActionPreference = "Stop"

# Refresh PATH so newly-installed CLIs (claude, codex, node) are visible
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify node is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install from https://nodejs.org and try again." -ForegroundColor Yellow
    exit 1
}

# Forward all args to cli.mjs
node "$PSScriptRoot\cli.mjs" @args
