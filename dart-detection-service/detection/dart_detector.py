"""
Dart Detector
Core detection logic using background subtraction and multi-camera triangulation.
"""
import cv2
import numpy as np
import asyncio
import logging
from typing import Callable, Optional
from datetime import datetime

from .camera_manager import CameraManager
from .score_mapper import ScoreMapper

logger = logging.getLogger(__name__)


class DartDetector:
    """
    Detects dart throws using OpenCV and multiple cameras.
    Uses background subtraction to detect when darts land.
    """
    
    def __init__(
        self,
        camera_indices: list[int],
        resolution: tuple[int, int] = (640, 480),
        on_dart_detected: Optional[Callable] = None,
        on_takeout_detected: Optional[Callable] = None
    ):
        self.camera_indices = camera_indices
        self.resolution = resolution
        self.on_dart_detected = on_dart_detected
        self.on_takeout_detected = on_takeout_detected
        
        # Detection state
        self.is_running = False
        self.is_calibrated = False
        self.cameras: dict[int, cv2.VideoCapture] = {}
        self.reference_frames: dict[int, np.ndarray] = {}
        self.dart_count = 0  # Track darts in current turn (1, 2, 3)
        
        # Camera manager
        self.camera_manager = CameraManager()
        
        # Score mapper (board coordinates to scores)
        self.score_mapper: Optional[ScoreMapper] = None
        
        # Detection parameters
        self.detection_threshold = 500  # Minimum pixel difference to detect dart
        self.min_dart_area = 200  # Minimum contour area for dart
        self.max_dart_area = 5000  # Maximum contour area
        
        # Takeout detection
        self.frames_since_last_dart = 0
        self.takeout_threshold = 30  # Frames to wait before detecting takeout
    
    def set_calibration(self, calibration_points: list[dict]):
        """
        Set board calibration from calibration points.
        
        Args:
            calibration_points: List of board marker positions
        """
        logger.info(f"Setting calibration with {len(calibration_points)} points")
        self.score_mapper = ScoreMapper(calibration_points)
        self.is_calibrated = True
    
    def capture_reference(self):
        """Capture reference frames (board with no darts)"""
        logger.info("Capturing reference frames...")
        
        for cam_idx in self.camera_indices:
            if cam_idx not in self.cameras:
                logger.error(f"Camera {cam_idx} not available")
                continue
            
            ret, frame = self.cameras[cam_idx].read()
            if ret:
                # Convert to grayscale for comparison
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                # Apply Gaussian blur to reduce noise
                blurred = cv2.GaussianBlur(gray, (5, 5), 0)
                self.reference_frames[cam_idx] = blurred
                logger.info(f"Reference captured for camera {cam_idx}")
        
        # Reset dart count when taking new reference
        self.dart_count = 0
    
    async def start(self):
        """Start dart detection"""
        logger.info("Starting dart detection...")
        self.is_running = True
        
        try:
            # Open all cameras
            for cam_idx in self.camera_indices:
                self.cameras[cam_idx] = self.camera_manager.open_camera(
                    cam_idx,
                    self.resolution[0],
                    self.resolution[1]
                )
            
            logger.info(f"Opened {len(self.cameras)} cameras")
            
            # Give cameras time to warm up
            await asyncio.sleep(1)
            
            # Capture initial reference
            self.capture_reference()
            
            # Start detection loop
            await self._detection_loop()
            
        except Exception as e:
            logger.error(f"Error in detection: {e}")
            self.is_running = False
            raise
    
    async def stop(self):
        """Stop dart detection"""
        logger.info("Stopping dart detection...")
        self.is_running = False
        
        # Release cameras
        for cam_idx in list(self.cameras.keys()):
            self.camera_manager.release_camera(cam_idx)
        
        self.cameras.clear()
        self.reference_frames.clear()
    
    async def _detection_loop(self):
        """Main detection loop"""
        logger.info("Detection loop started")
        
        while self.is_running:
            try:
                # Check all cameras for darts
                detected = await self._check_for_darts()
                
                if detected:
                    self.frames_since_last_dart = 0
                else:
                    self.frames_since_last_dart += 1
                
                # Detect takeout (darts pulled) after enough frames with no change
                if self.dart_count > 0 and self.frames_since_last_dart > self.takeout_threshold:
                    await self._handle_takeout()
                
                # Small delay to control frame rate
                await asyncio.sleep(0.033)  # ~30 FPS
                
            except Exception as e:
                logger.error(f"Error in detection loop: {e}")
                await asyncio.sleep(1)
    
    async def _check_for_darts(self) -> bool:
        """
        Check all cameras for dart detection.
        Returns True if a dart was detected.
        """
        detections = []
        
        for cam_idx in self.camera_indices:
            if cam_idx not in self.cameras or cam_idx not in self.reference_frames:
                continue
            
            ret, frame = self.cameras[cam_idx].read()
            if not ret:
                continue
            
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Calculate difference from reference
            diff = cv2.absdiff(self.reference_frames[cam_idx], blurred)
            
            # Threshold the difference
            _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
            
            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Check for dart-sized contours
            for contour in contours:
                area = cv2.contourArea(contour)
                
                if self.min_dart_area < area < self.max_dart_area:
                    # Found potential dart
                    M = cv2.moments(contour)
                    if M["m00"] > 0:
                        cx = int(M["m10"] / M["m00"])
                        cy = int(M["m01"] / M["m00"])
                        
                        detections.append({
                            'camera': cam_idx,
                            'x': cx,
                            'y': cy,
                            'area': area,
                            'confidence': min(1.0, area / 1000)  # Simple confidence based on area
                        })
        
        # If we have detections from multiple cameras, triangulate position
        if len(detections) >= 1:  # Start with single camera, improve later
            await self._process_detections(detections)
            return True
        
        return False
    
    async def _process_detections(self, detections: list[dict]):
        """
        Process dart detections from cameras and determine score.
        """
        # For now, use the detection with highest confidence
        best_detection = max(detections, key=lambda d: d['confidence'])
        
        # Increment dart count
        self.dart_count += 1
        if self.dart_count > 3:
            self.dart_count = 1  # Reset if somehow we got more than 3
        
        # Map to dartboard coordinates
        if self.score_mapper and self.is_calibrated:
            score_data = self.score_mapper.pixel_to_score(
                best_detection['x'],
                best_detection['y'],
                best_detection['camera']
            )
        else:
            # No calibration - return dummy data for testing
            logger.warning("No calibration - returning test data")
            score_data = {
                'segment': 'T20',
                'value': 20,
                'multiplier': 3
            }
        
        # Build event data
        event = {
            'segment': score_data['segment'],
            'value': score_data['value'],
            'multiplier': score_data['multiplier'],
            'dart_number': self.dart_count,
            'confidence': best_detection['confidence'],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Dart {self.dart_count} detected: {event['segment']} (confidence: {event['confidence']:.2f})")
        
        # Fire callback
        if self.on_dart_detected:
            await self.on_dart_detected(event)
        
        # Update reference to include this dart
        # (So we only detect NEW darts, not the same one repeatedly)
        self.capture_reference()
    
    async def _handle_takeout(self):
        """Handle takeout detection (darts removed from board)"""
        logger.info("Takeout detected - darts pulled")
        
        # Fire callback
        if self.on_takeout_detected:
            await self.on_takeout_detected()
        
        # Reset dart count
        self.dart_count = 0
        
        # Capture new reference (empty board)
        await asyncio.sleep(0.5)  # Wait for darts to be fully removed
        self.capture_reference()
