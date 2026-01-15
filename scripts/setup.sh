#!/bin/bash
set -e

echo "🎯 MyDarts Setup Script"
echo "======================="
echo ""
echo "This script will set up MyDarts on your Raspberry Pi."
echo "It works on any network - no IP configuration needed!"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}Step 1: Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y python3 python3-pip nodejs npm dotnet-sdk-8.0

echo ""
echo -e "${BLUE}Step 2: Setting up environment file...${NC}"
if [ ! -f .env ]; then
    echo "No .env file found. Let's create one!"
    cp .env.template .env
    echo ""
    echo -e "${YELLOW}Please edit .env and add your Autodarts credentials:${NC}"
    echo "  - AUTODARTS_EMAIL"
    echo "  - AUTODARTS_PASSWORD"
    echo "  - AUTODARTS_BOARD_ID"
    echo ""
    read -p "Press Enter after editing .env to continue..."
fi

# Load environment variables
source .env

echo ""
echo -e "${BLUE}Step 3: Installing darts-caller...${NC}"
if [ ! -d "darts-caller" ]; then
    git clone https://github.com/lbormann/darts-caller.git
fi
cd darts-caller
pip3 install -r requirements.txt
cd ..

echo ""
echo -e "${BLUE}Step 4: Building MyDarts Backend...${NC}"
cd MyDarts.Api
dotnet restore
dotnet build -c Release
cd ..

echo ""
echo -e "${BLUE}Step 5: Building MyDarts Frontend...${NC}"
cd my-darts-ui
npm install
npm run build
cd ..

echo ""
echo -e "${BLUE}Step 6: Creating systemd services...${NC}"

# Create darts-caller service
sudo tee /etc/systemd/system/darts-caller.service > /dev/null <<EOF
[Unit]
Description=Darts Caller Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR/darts-caller
ExecStart=/usr/bin/python3 darts-caller.py -U "${AUTODARTS_EMAIL}" -P "${AUTODARTS_PASSWORD}" -B "${AUTODARTS_BOARD_ID}" -M /tmp/darts-media -WEBDH 1
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create MyDarts API service
sudo tee /etc/systemd/system/mydarts-api.service > /dev/null <<EOF
[Unit]
Description=MyDarts API Service
After=network.target darts-caller.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR/MyDarts.Api
ExecStart=/usr/bin/dotnet run --urls "http://0.0.0.0:5025"
Restart=always
RestartSec=10
Environment="ASPNETCORE_ENVIRONMENT=Production"

[Install]
WantedBy=multi-user.target
EOF

# Create MyDarts UI service
sudo tee /etc/systemd/system/mydarts-ui.service > /dev/null <<EOF
[Unit]
Description=MyDarts UI Service
After=network.target mydarts-api.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR/my-darts-ui
ExecStart=/usr/bin/npx serve -s build -l 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo -e "${BLUE}Step 7: Enabling and starting services...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable darts-caller.service
sudo systemctl enable mydarts-api.service
sudo systemctl enable mydarts-ui.service
sudo systemctl start darts-caller.service
sudo systemctl start mydarts-api.service
sudo systemctl start mydarts-ui.service

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "MyDarts is now running on your Pi!"
echo ""
echo "📱 Access it from any device on your network:"
echo "   http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "🎮 Quick commands:"
echo "   Check status:  sudo systemctl status mydarts-api"
echo "   View logs:     sudo journalctl -u mydarts-api -f"
echo "   Restart:       sudo systemctl restart mydarts-api"
echo ""
echo "🔧 To update after git pull:"
echo "   ./scripts/update.sh"
echo ""