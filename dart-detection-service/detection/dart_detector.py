"""
Dart Detector
Core detection logic using triangle fitting and multi-camera fusion.
"""
import cv2
import numpy as np
import asyncio
import logging
from typing import Callable, Optional
from datetime import datetime

from .camera_manager import CameraManager
from .click_calibrator import ClickCalibrator
from .triangle_detector import TriangleDartDetector
from .multi_camera_fusion import MultiCameraFusion, CameraDetection
from .score_calculator import ScoreCalculator

logger = logging.getLogger(__name__)


class DartDetector:
    """
    Detects dart throws using OpenCV, triangle fitting, and multiple cameras.
    """
    
    def __init__(
        self,
        camera_indices: list[int],
        resolution: tuple[int, int] = (640, 480),
        on_dart_detected: Optional[Callable] = None,
        on_takeout_detected: Optional[Callable] = None,
        calibrator: Optional[ClickCalibrator] = None,
        triangle_detector: Optional[TriangleDartDetector] = None
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
        self.dart_count = 0
        
        # Components
        self.camera_manager = CameraManager()
        self.calibrator = calibrator
        self.triangle_detector = triangle_detector or TriangleDartDetector()
        self.camera_fusion = MultiCameraFusion(sample_frames=20)
        self.score_calculators: dict[int, ScoreCalculator] = {}
        
        # Setup score calculators from calibration
        if self.calibrator:
            for cam_id in camera_indices:
                if self.calibrator.is_calibrated(cam_id):
                    center = self.calibrator.get_board_center(cam_id)
                    radii = self.calibrator.get_ring_radii(cam_id)
                    self.score_calculators[cam_id] = ScoreCalculator(center, radii)
                    self.is_calibrated = True
        
        # Detection parameters
        self.frames_since_last_dart = 0
        self.takeout_threshold = 30
    
    def capture_reference(self):
        """Capture reference frames (board with no darts)"""
        logger.info("Capturing reference frames...")
        
        for cam_idx in self.camera_indices:
            if cam_idx not in self.cameras:
                continue
            
            ret, frame = self.cameras[cam_idx].read()
            if ret:
                # Transform if calibrated
                if self.calibrator and self.calibrator.is_calibrated(cam_idx):
                    frame = self.calibrator.transform_frame(frame, cam_idx)
                
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                blurred = cv2.GaussianBlur(gray, (5, 5), 0)
                self.reference_frames[cam_idx] = blurred
                logger.info(f"Reference captured for camera {cam_idx}")
        
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
            
            await asyncio.sleep(1)
            self.capture_reference()
            
            await self._detection_loop()
            
        except Exception as e:
            logger.error(f"Error in detection: {e}")
            self.is_running = False
            raise
    
    async def stop(self):
        """Stop dart detection"""
        logger.info("Stopping dart detection...")
        self.is_running = False
        
        for cam_idx in list(self.cameras.keys()):
            self.camera_manager.release_camera(cam_idx)
        
        self.cameras.clear()
        self.reference_frames.clear()
    
    async def _detection_loop(self):
        """Main detection loop"""
        logger.info("Detection loop started")
        
        while self.is_running:
            try:
                detected = await self._check_for_darts()
                
                if detected:
                    self.frames_since_last_dart = 0
                else:
                    self.frames_since_last_dart += 1
                
                if self.dart_count > 0 and self.frames_since_last_dart > self.takeout_threshold:
                    await self._handle_takeout()
                
                await asyncio.sleep(0.033)  # ~30 FPS
                
            except Exception as e:
                logger.error(f"Error in detection loop: {e}")
                await asyncio.sleep(1)
    
    async def _check_for_darts(self) -> bool:
        """Check all cameras for dart detection"""
        detections = []
        
        for cam_idx in self.camera_indices:
            if cam_idx not in self.cameras or cam_idx not in self.reference_frames:
                continue
            
            ret, frame = self.cameras[cam_idx].read()
            if not ret:
                continue
            
            # Transform if calibrated
            if self.calibrator and self.calibrator.is_calibrated(cam_idx):
                frame = self.calibrator.transform_frame(frame, cam_idx)
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Calculate difference
            diff = cv2.absdiff(self.reference_frames[cam_idx], blurred)
            
            # Detect dart tips using triangle fitting
            dart_detections = self.triangle_detector.detect_dart(diff, top_n=1)
            
            if dart_detections:
                best_dart = dart_detections[0]
                
                # Calculate score if calibrated
                if cam_idx in self.score_calculators:
                    score_result = self.score_calculators[cam_idx].calculate_score(
                        best_dart.tip_x,
                        best_dart.tip_y
                    )
                    
                    detections.append(CameraDetection(
                        camera_id=cam_idx,
                        segment=score_result.segment,
                        value=score_result.value,
                        multiplier=score_result.multiplier,
                        confidence=best_dart.confidence,
                        x=best_dart.tip_x,
                        y=best_dart.tip_y
                    ))
        
        # Fuse detections from all cameras
        if detections:
            self.camera_fusion.add_detections(detections)
            
            # Check if we have enough samples
            if self.camera_fusion.get_buffer_size() >= 10:
                fused = self.camera_fusion.get_fused_detection()
                
                if fused and fused.agreement >= 0.5:
                    await self._process_fused_detection(fused)
                    self.camera_fusion.reset_buffer()
                    return True
        
        return False
    
    async def _process_fused_detection(self, fused):
        """Process fused detection from multiple cameras"""
        self.dart_count += 1
        if self.dart_count > 3:
            self.dart_count = 1
        
        event = {
            'segment': fused.segment,
            'value': fused.value,
            'multiplier': fused.multiplier,
            'dart_number': self.dart_count,
            'confidence': fused.confidence,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Dart {self.dart_count} detected: {event['segment']} (conf: {fused.confidence:.2f}, agreement: {fused.agreement:.2f})")
        
        if self.on_dart_detected:
            await self.on_dart_detected(event)
        
        # Update reference
        self.capture_reference()
    
    async def _handle_takeout(self):
        """Handle takeout detection"""
        logger.info("Takeout detected")
        
        if self.on_takeout_detected:
            await self.on_takeout_detected()
        
        self.dart_count = 0
        await asyncio.sleep(0.5)
        self.capture_reference()
