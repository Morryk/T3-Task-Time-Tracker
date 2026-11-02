#!/bin/bash
# Build script per Linux/macOS - genera eseguibili Go per Windows e Linux
# Prerequisiti: Node.js, Go 1.21+

set -e

echo "=== T3 Task Tracker - Build Go Binaries ==="

# 1. Build frontend
echo "[1/5] Building frontend..."
npm run build

# 2. Initialize Go module if needed
echo "[2/5] Setting up Go module..."
cd server
if [ ! -f "go.mod" ]; then
    go mod init t3-tracker
fi
go mod tidy
cd ..

# 3. Sync dist embed
echo "[3/5] Syncing dist into server/dist..."
rm -rf server/dist
cp -r dist server/dist

# 4. Build Windows binary
echo "[4/5] Building Windows binary (amd64)..."
(cd server && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o ../t3-windows.exe .) \
  || { echo "Windows build failed!" >&2; exit 1; }
echo "Created: t3-windows.exe"

# 5. Build Linux binary
echo "[5/5] Building Linux binary (amd64)..."
(cd server && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o ../t3-linux .) \
  || { echo "Linux build failed!" >&2; exit 1; }
echo "Created: t3-linux"

# Summary
echo ""
echo "=== Build Complete ==="
echo "Binari creati nella root del progetto:"
echo "  - t3-windows.exe (Windows)"
echo "  - t3-linux (Linux)"
echo ""
echo "Per testare: ./t3-linux"
