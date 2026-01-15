"""
MyDarts Custom Detection Service
FastAPI server that detects dart throws using OpenCV and multiple cameras.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import logging
from typing import Optional

from detection.dart_detector import DartDetector
from detection.camera_manager import CameraManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MyDarts Detection Service")

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global detector instance
detector: Optional[DartDetector] = None
camera_manager: Optional[CameraManager] = None

# WebSocket connections
active_connections: list[WebSocket] = []


class StartRequest(BaseModel):
    camera_indices: list[int] = [0, 1, 2]  # Default to 3 cameras
    resolution: tuple[int, int] = (640, 480)


class CalibrationRequest(BaseModel):
    calibration_points: list[dict]  # Board marker positions


@app.on_event("startup")
async def startup_event():
    """Initialize camera manager on startup"""
    global camera_manager
    camera_manager = CameraManager()
    logger.info("Detection service started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global detector, camera_manager
    if detector:
        await detector.stop()
    if camera_manager:
        camera_manager.release_all()
    logger.info("Detection service stopped")


@app.get("/health")
async def health():
    """Health check endpoint"""
    is_running = detector is not None and detector.is_running
    is_calibrated = detector is not None and detector.is_calibrated
    
    cameras_connected = 0
    if camera_manager:
        cameras_connected = len(camera_manager.get_available_cameras())
    
    return {
        "status": "ok",
        "is_running": is_running,
        "cameras_connected": cameras_connected > 0,
        "calibrated": is_calibrated,
        "camera_count": cameras_connected
    }


@app.post("/start")
async def start_detection(request: StartRequest):
    """Start dart detection"""
    global detector
    
    if detector and detector.is_running:
        return {"error": "Detection already running"}, 400
    
    try:
        logger.info(f"Starting detection with cameras: {request.camera_indices}")
        
        # Initialize detector
        detector = DartDetector(
            camera_indices=request.camera_indices,
            resolution=request.resolution,
            on_dart_detected=broadcast_dart_detected,
            on_takeout_detected=broadcast_takeout_detected
        )
        
        # Start detection in background
        asyncio.create_task(detector.start())
        
        return {
            "status": "started",
            "cameras": request.camera_indices,
            "resolution": request.resolution
        }
    except Exception as e:
        logger.error(f"Failed to start detection: {e}")
        return {"error": str(e)}, 500


@app.post("/stop")
async def stop_detection():
    """Stop dart detection"""
    global detector
    
    if not detector:
        return {"status": "not_running"}
    
    try:
        await detector.stop()
        detector = None
        return {"status": "stopped"}
    except Exception as e:
        logger.error(f"Failed to stop detection: {e}")
        return {"error": str(e)}, 500


@app.post("/calibrate")
async def calibrate(request: CalibrationRequest):
    """Set calibration data for the dartboard"""
    global detector
    
    if not detector:
        return {"error": "Detector not running. Start detection first."}, 400
    
    try:
        detector.set_calibration(request.calibration_points)
        return {"status": "calibrated", "points": len(request.calibration_points)}
    except Exception as e:
        logger.error(f"Calibration failed: {e}")
        return {"error": str(e)}, 500


@app.post("/reference")
async def set_reference():
    """Capture reference image (board with no darts)"""
    global detector
    
    if not detector:
        return {"error": "Detector not running"}, 400
    
    try:
        detector.capture_reference()
        return {"status": "reference_captured"}
    except Exception as e:
        logger.error(f"Failed to capture reference: {e}")
        return {"error": str(e)}, 500


@app.get("/cameras")
async def list_cameras():
    """List available camera devices"""
    if not camera_manager:
        return {"cameras": []}
    
    available = camera_manager.get_available_cameras()
    return {
        "cameras": [
            {
                "index": idx,
                "name": f"Camera {idx}",
                "device": f"/dev/video{idx}"
            }
            for idx in available
        ]
    }


@app.websocket("/events")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time detection events"""
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"WebSocket connected. Active connections: {len(active_connections)}")
    
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(1)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Active connections: {len(active_connections)}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)


async def broadcast_dart_detected(event: dict):
    """Broadcast dart detection event to all connected WebSocket clients"""
    message = {
        "type": "dart_detected",
        "segment": event["segment"],
        "value": event["value"],
        "multiplier": event["multiplier"],
        "dartNumber": event["dart_number"],
        "confidence": event.get("confidence", 1.0),
        "timestamp": event.get("timestamp")
    }
    
    logger.info(f"Broadcasting dart: {event['segment']}")
    
    # Send to all connected clients
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send to WebSocket: {e}")
            disconnected.append(connection)
    
    # Remove disconnected clients
    for conn in disconnected:
        active_connections.remove(conn)


async def broadcast_takeout_detected():
    """Broadcast takeout (darts pulled) event"""
    message = {
        "type": "takeout_detected",
        "timestamp": None  # Add timestamp if needed
    }
    
    logger.info("Broadcasting takeout")
    
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send to WebSocket: {e}")
            disconnected.append(connection)
    
    for conn in disconnected:
        active_connections.remove(conn)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")
