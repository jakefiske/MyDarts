#!/bin/bash
# MyDarts Pi Setup Script
# Run this once after cloning the repo

set -e

echo "=== MyDarts Pi Setup ==="

CURRENT_USER="$USER"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Current user: $CURRENT_USER"
echo "Project directory: $PROJECT_DIR"

# Install dependencies
echo ""
echo "=== Installing dependencies ==="
sudo apt-get update
sudo apt-get install -y unclutter chromium-browser

# Build the project
echo ""
echo "=== Building MyDarts ==="
cd "$PROJECT_DIR/MyDarts.Api"
dotnet build --configuration Release

# Build frontend
echo "Building frontend..."
cd "$PROJECT_DIR/my-darts-ui"
npm install
npm run build
mkdir -p "$PROJECT_DIR/MyDarts.Api/wwwroot"
cp -r build/* "$PROJECT_DIR/MyDarts.Api/wwwroot/"

# Install systemd service with correct user
echo ""
echo "=== Installing systemd service ==="
# Create temp service file with correct user and paths
sed -e "s|User=pi|User=$CURRENT_USER|g" \
    -e "s|/home/pi|$HOME|g" \
    -e "s|ExecStart=/usr/bin/dotnet|ExecStart=$(which dotnet)|g" \
    "$SCRIPT_DIR/mydarts.service" | sudo tee /etc/systemd/system/mydarts.service > /dev/null

sudo systemctl daemon-reload
sudo systemctl enable mydarts.service
sudo systemctl start mydarts.service
echo "Service installed and enabled for user: $CURRENT_USER"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "MyDarts API is now running on http://localhost:5025"
echo ""
echo "Commands:"
echo "  View logs:         journalctl -u mydarts -f"
echo "  Restart:           sudo systemctl restart mydarts"
echo "  Stop:              sudo systemctl stop mydarts"
echo ""
echo "Open Chromium and navigate to http://localhost:5025"
echo "Use the fullscreen button in the app to enter/exit kiosk mode"
echo ""