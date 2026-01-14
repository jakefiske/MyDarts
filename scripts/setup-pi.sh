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
echo "Service installed and enabled for user: $CURRENT_USER"

# Make kiosk script executable
chmod +x "$SCRIPT_DIR/kiosk.sh"

# Setup autostart for kiosk (LXDE)
echo ""
echo "=== Setting up kiosk autostart ==="
mkdir -p ~/.config/lxsession/LXDE-pi
cat > ~/.config/lxsession/LXDE-pi/autostart << EOF
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@$SCRIPT_DIR/kiosk.sh
EOF

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Commands:"
echo "  Start API now:     sudo systemctl start mydarts"
echo "  Stop API:          sudo systemctl stop mydarts"
echo "  View logs:         journalctl -u mydarts -f"
echo "  Restart:           sudo systemctl restart mydarts"
echo ""
echo "Reboot to start in kiosk mode, or run:"
echo "  sudo systemctl start mydarts && $SCRIPT_DIR/kiosk.sh"
echo ""