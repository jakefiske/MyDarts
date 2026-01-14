# MyDarts Project Packager
# Creates a clean zip of the project excluding build artifacts and large files

param(
    [string]$OutputPath = "$PSScriptRoot\..\MyDarts-Package.zip"
)

Write-Host "Creating MyDarts project package..." -ForegroundColor Green

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$TempDir = Join-Path $env:TEMP "MyDarts-Package-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

try {
    # Create temp directory
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    Write-Host "Temp directory: $TempDir" -ForegroundColor Cyan

    # Copy project files
    Write-Host "Copying project files..." -ForegroundColor Yellow
    $ExcludeDirs = @(
        'bin',
        'obj',
        'node_modules',
        '.git',
        '.vs',
        '.vscode',
        'build',
        'dist',
        'out',
        'packages',
        '.angular',
        'coverage'
    )

    $ExcludeFiles = @(
        '*.db',
        '*.db-shm',
        '*.db-wal',
        '*.zip',
        '*.log',
        '.DS_Store',
        'Thumbs.db'
    )

    # Build exclude patterns for robocopy
    $ExcludeDirArgs = $ExcludeDirs | ForEach-Object { "/XD `"$_`"" }
    $ExcludeFileArgs = $ExcludeFiles | ForEach-Object { "/XF `"$_`"" }

    $RobocopyArgs = @(
        "`"$ProjectRoot`"",
        "`"$TempDir`"",
        "/E",           # Copy subdirectories including empty ones
        "/NFL",         # No file list
        "/NDL",         # No directory list
        "/NJH",         # No job header
        "/NJS",         # No job summary
        "/NP"           # No progress
    ) + $ExcludeDirArgs + $ExcludeFileArgs

    $RobocopyCommand = "robocopy $($RobocopyArgs -join ' ')"
    Invoke-Expression $RobocopyCommand | Out-Null

    # Create zip file
    Write-Host "Creating zip file..." -ForegroundColor Yellow
    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath -Force
    }

    Compress-Archive -Path "$TempDir\*" -DestinationPath $OutputPath -CompressionLevel Optimal

    $ZipSize = (Get-Item $OutputPath).Length / 1MB
    Write-Host "Package created successfully!" -ForegroundColor Green
    Write-Host "Location: $OutputPath" -ForegroundColor Cyan
    Write-Host "Size: $([Math]::Round($ZipSize, 2)) MB" -ForegroundColor Cyan
}
catch {
    Write-Host "Error creating package: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Cleanup temp directory
    if (Test-Path $TempDir) {
        Remove-Item $TempDir -Recurse -Force
    }
}

Write-Host "`nPackage ready for deployment!" -ForegroundColor Green