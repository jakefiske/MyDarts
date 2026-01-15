# MyDarts Custom Detection Service

Python-based dart detection service using OpenCV and your existing 3 cameras.

## Quick Start

### 1. Install Dependencies

```bash
cd dart-detection-service
pip3 install -r requirements.txt
```

### 2. Test Camera Access

```bash
# List available cameras
python3 -c "import cv2; print([i for i in range(10) if cv2.VideoCapture(i).isOpened()])"
```

You should see: `[0, 1, 2]` or similar

### 3. Start the Detection Service

```bash
python3 main.py
```

Server starts on `http://localhost:8080`

## Testing

### Check Health

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "ok",
  "is_running": false,
  "cameras_connected": true,
  "calibrated": false,
  "camera_count": 3
}
```

### List Cameras

```bash
curl http://localhost:8080/cameras
```

### Start Detection

```bash
curl -X POST http://localhost:8080/start \
  -H "Content-Type: application/json" \
  -d '{"camera_indices": [0, 1, 2], "resolution": [640, 480]}'
```

### Capture Reference (Empty Board)

```bash
# Remove all darts first!
curl -X POST http://localhost:8080/reference
```

### Test Throw Detection

1. Start detection
2. Capture reference (no darts)
3. Throw a dart
4. Watch logs - you should see detection events

### Stop Detection

```bash
curl -X POST http://localhost:8080/stop
```

## WebSocket Testing

Connect to `ws://localhost:8080/events` to receive real-time detection events:

```javascript
const ws = new WebSocket('ws://localhost:8080/events');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
  
  if (data.type === 'dart_detected') {
    console.log(`Dart ${data.dartNumber}: ${data.segment}`);
  }
};
```

## Integration with MyDarts Backend

The .NET `OpenCVThrowSource` connects to this service via WebSocket and forwards events to your game logic.

## Current State

**✅ Working:**
- Camera access
- HTTP API endpoints
- WebSocket event broadcasting
- Basic background subtraction detection
- Multi-camera support

**⚠️ Needs Work:**
- Calibration system (currently returns dummy scores)
- Accurate coordinate → score mapping
- Multi-camera triangulation
- Confidence scoring

**Next Steps:**
1. Test basic detection with your cameras
2. Build calibration UI
3. Improve detection accuracy
4. Add proper coordinate transformation

## Troubleshooting

### "Failed to open camera X"

Check if Autodarts is using the cameras:
```bash
sudo systemctl stop autodarts
```

### "ModuleNotFoundError: No module named 'cv2'"

Install OpenCV:
```bash
pip3 install opencv-python
```

### Detection too sensitive / not sensitive enough

Adjust parameters in `detection/dart_detector.py`:
```python
self.detection_threshold = 500  # Lower = more sensitive
self.min_dart_area = 200        # Minimum dart size
```

## Architecture

```
FastAPI Server (main.py)
    ↓
DartDetector (dart_detector.py)
    ↓
CameraManager (camera_manager.py) → OpenCV Cameras
    ↓
ScoreMapper (score_mapper.py) → Pixel → Score
    ↓
WebSocket Events → .NET Backend
```
