#!/bin/bash
# Quick update script - pull latest and restart

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Updating MyDarts ==="

cd "$PROJECT_DIR"

# Pull latest
echo "Pulling latest..."
git pull

# Rebuild backend
echo "Building backend..."
cd MyDarts.Api
dotnet build --configuration Release

# Rebuild frontend
echo "Building frontend..."
cd ../my-darts-ui
npm install
npm run build
cp -r build/* ../MyDarts.Api/wwwroot/

# Restart service
echo "Restarting service..."
sudo systemctl restart mydarts

echo ""
echo "=== Update complete ==="
echo "View logs: journalctl -u mydarts -f"