#!/bin/bash

echo "🧪 Testing MyDarts Detection Service"
echo "===================================="
echo ""

BASE_URL="http://localhost:8080"

# Test 1: Health check
echo "Test 1: Health Check"
curl -s $BASE_URL/health | python3 -m json.tool || echo "❌ Health check failed"
echo ""

# Test 2: List cameras
echo "Test 2: List Cameras"
curl -s $BASE_URL/cameras | python3 -m json.tool || echo "❌ Camera list failed"
echo ""

# Test 3: Start detection
echo "Test 3: Start Detection (cameras 0,1,2)"
curl -s -X POST $BASE_URL/start \
  -H "Content-Type: application/json" \
  -d '{"camera_indices": [0, 1, 2], "resolution": [640, 480]}' \
  | python3 -m json.tool || echo "❌ Start failed"
echo ""

sleep 2

# Test 4: Capture reference
echo "Test 4: Capture Reference (make sure board is empty!)"
echo "Remove all darts and press Enter..."
read
curl -s -X POST $BASE_URL/reference | python3 -m json.tool || echo "❌ Reference capture failed"
echo ""

echo "✅ Basic tests complete!"
echo ""
echo "Now throw a dart and watch the service logs."
echo "You should see 'Dart detected' messages."
echo ""
echo "To stop detection:"
echo "  curl -X POST $BASE_URL/stop"
