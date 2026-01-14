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

# Rebuild
echo "Building..."
dotnet build --configuration Release

# Restart service
echo "Restarting service..."
sudo systemctl restart mydarts

echo ""
echo "=== Update complete ==="
echo "View logs: journalctl -u mydarts -f"