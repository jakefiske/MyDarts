#!/bin/bash

echo "🎯 MyDarts Detection Service - Quick Start"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Run this script from the dart-detection-service directory"
    echo "   cd ~/MyDarts/dart-detection-service"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Install with: sudo apt install python3"
    exit 1
fi

echo "✅ Python3 found: $(python3 --version)"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "✅ Dependencies installed"

# Check cameras
echo ""
echo "📷 Checking cameras..."
python3 -c "
import cv2
cameras = [i for i in range(10) if cv2.VideoCapture(i).isOpened()]
print(f'Found {len(cameras)} cameras: {cameras}')
if len(cameras) == 0:
    print('⚠️  No cameras found!')
    print('Make sure Autodarts is stopped: sudo systemctl stop autodarts')
" || echo "⚠️  Could not check cameras (OpenCV not installed yet?)"

echo ""
echo "🚀 Starting detection service on http://localhost:8080"
echo "   Press Ctrl+C to stop"
echo ""

# Run the service
python3 main.py
