# Build script per Windows - genera eseguibili Go per Windows e Linux
# Prerequisiti: Node.js, Go 1.21+

Write-Host "=== T3 Task Tracker - Build Go Binaries ===" -ForegroundColor Cyan

# 1. Build frontend
Write-Host "`n[1/5] Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

# 2. Initialize Go module if needed
Write-Host "`n[2/5] Setting up Go module..." -ForegroundColor Yellow
Set-Location server
if (-not (Test-Path "go.mod")) {
    go mod init t3-tracker
}
go mod tidy
Set-Location ..

# 3. Sync dist embed
Write-Host "`n[3/5] Syncing dist into server/dist..." -ForegroundColor Yellow
Remove-Item -Recurse -Force server/dist -ErrorAction SilentlyContinue
Copy-Item -Recurse dist server/dist

# 4. Build Windows binary
Write-Host "`n[4/5] Building Windows binary (amd64)..." -ForegroundColor Yellow
Push-Location server
$env:GOOS = "windows"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"
go build -ldflags="-s -w" -o ../t3-windows.exe .
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "Windows build failed!" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "Created: t3-windows.exe" -ForegroundColor Green

# 5. Build Linux binary
Write-Host "`n[5/5] Building Linux binary (amd64)..." -ForegroundColor Yellow
Push-Location server
$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"
go build -ldflags="-s -w" -o ../t3-linux .
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "Linux build failed!" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "Created: t3-linux" -ForegroundColor Green

# Summary
Write-Host "`n=== Build Complete ===" -ForegroundColor Cyan
Write-Host "Binari creati nella root del progetto:"
Write-Host "  - t3-windows.exe (Windows)"
Write-Host "  - t3-linux (Linux)"
Write-Host "`nPer testare: .\t3-windows.exe"
