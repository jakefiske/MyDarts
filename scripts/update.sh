#!/bin/bash
set -e

echo "🎯 MyDarts Update Script"
echo "========================"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo -e "${BLUE}Building backend...${NC}"
cd MyDarts.Api
dotnet build -c Release
cd ..

echo ""
echo -e "${BLUE}Building frontend...${NC}"
cd my-darts-ui
npm install
npm run build
cd ..

echo ""
echo -e "${BLUE}Restarting services...${NC}"
sudo systemctl restart mydarts-api.service
sudo systemctl restart mydarts-ui.service

echo ""
echo -e "${GREEN}✅ Update complete!${NC}"
echo ""
echo "Check status: sudo systemctl status mydarts-api"