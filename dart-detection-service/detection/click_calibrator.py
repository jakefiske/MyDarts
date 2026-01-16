"""
Click-Based Board Calibration
User clicks 3 points per camera to calibrate dartboard position.
Stores calibration in SQLite database for persistence.
"""
import cv2
import numpy as np
import logging
import math
import sqlite3
import json
from pathlib import Path
from typing import Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class CalibrationResult:
    """Result from calibration attempt"""
    success: bool
    message: str
    transform_matrix: Optional[np.ndarray] = None


class ClickCalibrator:
    """
    Calibrates dartboard using 3 clicked points:
    1. Bullseye center
    2. Outer double at 12 o'clock (top)
    3. Outer double at 3 o'clock (right)
    
    Stores calibration in SQLite database for persistence.
    """
    
    def __init__(self, target_size: Tuple[int, int] = (800, 800), db_path: str = "/home/pi/mydarts_calibration.db"):
        """
        Initialize calibrator.
        
        Args:
            target_size: Size of the transformed output image
            db_path: Path to SQLite database for storing calibration
        """
        self.target_size = target_size
        self.db_path = db_path
        
        # Store calibration per camera
        self.calibrations: dict[int, dict] = {}
        
        # Board center in transformed space
        self.board_center = (target_size[0] // 2, target_size[1] // 2)
        
        # Standard dartboard dimensions (in mm)
        # Outer double: 170mm from center
        # Scale to 800x800 image
        scale_factor = target_size[0] / (2 * 170)
        
        self.ring_radii = {
            'double_outer': int(170 * scale_factor),
            'double_inner': int(160 * scale_factor),
            'triple_outer': int(107 * scale_factor),
            'triple_inner': int(97 * scale_factor),
            'bull_outer': int(16 * scale_factor),
            'bull_inner': int(7 * scale_factor)
        }
        
        # Initialize database
        self._init_database()
        
        # Load existing calibrations
        self._load_all_calibrations()
    
    def _init_database(self):
        """Create database and table if they don't exist"""
        try:
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS camera_calibration (
                    camera_id INTEGER PRIMARY KEY,
                    center_x INTEGER NOT NULL,
                    center_y INTEGER NOT NULL,
                    radius REAL NOT NULL,
                    transform_matrix TEXT NOT NULL,
                    calibrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info(f"Calibration database initialized at {self.db_path}")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
    
    def _save_calibration(self, camera_id: int):
        """Save calibration to database"""
        if camera_id not in self.calibrations:
            return
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            calib = self.calibrations[camera_id]
            
            # Convert numpy array to JSON string
            matrix_json = json.dumps(calib['transform_matrix'].tolist())
            
            cursor.execute('''
                INSERT OR REPLACE INTO camera_calibration 
                (camera_id, center_x, center_y, radius, transform_matrix)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                camera_id,
                int(calib['center'][0]),
                int(calib['center'][1]),
                float(calib['radius']),
                matrix_json
            ))
            
            conn.commit()
            conn.close()
            logger.info(f"Calibration saved for camera {camera_id}")
        except Exception as e:
            logger.error(f"Failed to save calibration: {e}")
    
    def _load_all_calibrations(self):
        """Load all calibrations from database on startup"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT camera_id, center_x, center_y, radius, transform_matrix FROM camera_calibration')
            rows = cursor.fetchall()
            
            for row in rows:
                camera_id, center_x, center_y, radius, matrix_json = row
                
                # Convert JSON string back to numpy array
                matrix_list = json.loads(matrix_json)
                transform_matrix = np.array(matrix_list, dtype=np.float32)
                
                self.calibrations[camera_id] = {
                    'transform_matrix': transform_matrix,
                    'center': (center_x, center_y),
                    'radius': radius,
                    'ring_radii': self.ring_radii,
                    'board_center': self.board_center
                }
                
                logger.info(f"Loaded calibration for camera {camera_id}")
            
            conn.close()
        except Exception as e:
            logger.error(f"Failed to load calibrations: {e}")
    
    def calibrate_with_clicks(
        self,
        camera_id: int,
        center_x: int,
        center_y: int,
        top_x: int,
        top_y: int,
        right_x: int,
        right_y: int
    ) -> CalibrationResult:
        """
        Calibrate camera using 3 clicked points.
        
        Args:
            camera_id: Camera identifier
            center_x, center_y: Bullseye center point
            top_x, top_y: Outer double at 12 o'clock
            right_x, right_y: Outer double at 3 o'clock
            
        Returns:
            CalibrationResult
        """
        try:
            # Calculate radius from center to edge
            radius_top = math.sqrt((top_x - center_x)**2 + (top_y - center_y)**2)
            radius_right = math.sqrt((right_x - center_x)**2 + (right_y - center_y)**2)
            
            # Use average radius
            avg_radius = (radius_top + radius_right) / 2
            
            if avg_radius < 50:
                return CalibrationResult(
                    success=False,
                    message="Radius too small - are the points correct?"
                )
            
            # Calculate 4 corners of the board square (outer double ring)
            # Top-left
            tl_x = center_x - avg_radius
            tl_y = center_y - avg_radius
            
            # Top-right
            tr_x = center_x + avg_radius
            tr_y = center_y - avg_radius
            
            # Bottom-left
            bl_x = center_x - avg_radius
            bl_y = center_y + avg_radius
            
            # Bottom-right
            br_x = center_x + avg_radius
            br_y = center_y + avg_radius
            
            # Source points (camera view)
            src_points = np.float32([
                [tl_x, tl_y],  # Top-left
                [tr_x, tr_y],  # Top-right
                [bl_x, bl_y],  # Bottom-left
                [br_x, br_y]   # Bottom-right
            ])
            
            # Destination points (transformed view)
            dst_points = np.float32([
                [0, 0],                                    # Top-left
                [self.target_size[0], 0],                  # Top-right
                [0, self.target_size[1]],                  # Bottom-left
                [self.target_size[0], self.target_size[1]] # Bottom-right
            ])
            
            # Calculate perspective transform
            transform_matrix = cv2.getPerspectiveTransform(src_points, dst_points)
            
            # Store calibration
            self.calibrations[camera_id] = {
                'transform_matrix': transform_matrix,
                'center': (center_x, center_y),
                'radius': avg_radius,
                'ring_radii': self.ring_radii,
                'board_center': self.board_center
            }
            
            logger.info(f"Camera {camera_id} calibrated - center: ({center_x}, {center_y}), radius: {avg_radius:.1f}px")
            
            # Save to database
            self._save_calibration(camera_id)
            
            return CalibrationResult(
                success=True,
                message=f"Camera {camera_id} calibrated successfully",
                transform_matrix=transform_matrix
            )
            
        except Exception as e:
            logger.error(f"Calibration failed: {e}")
            return CalibrationResult(
                success=False,
                message=f"Calibration error: {str(e)}"
            )
    
    def transform_frame(self, frame: np.ndarray, camera_id: int) -> Optional[np.ndarray]:
        """Transform frame to calibrated perspective"""
        if camera_id not in self.calibrations:
            return None
        
        matrix = self.calibrations[camera_id]['transform_matrix']
        transformed = cv2.warpPerspective(frame, matrix, self.target_size)
        return transformed
    
    def transform_point(
        self,
        point: Tuple[int, int],
        camera_id: int
    ) -> Optional[Tuple[int, int]]:
        """Transform a point from camera coordinates to board coordinates"""
        if camera_id not in self.calibrations:
            return None
        
        matrix = self.calibrations[camera_id]['transform_matrix']
        point_array = np.array([[[point[0], point[1]]]], dtype=np.float32)
        transformed = cv2.perspectiveTransform(point_array, matrix)
        
        return tuple(transformed[0][0].astype(int))
    
    def is_calibrated(self, camera_id: int) -> bool:
        """Check if camera is calibrated"""
        return camera_id in self.calibrations
    
    def get_board_center(self, camera_id: int) -> Optional[Tuple[int, int]]:
        """Get board center in transformed coordinates"""
        if camera_id in self.calibrations:
            return self.calibrations[camera_id]['board_center']
        return None
    
    def get_ring_radii(self, camera_id: int) -> Optional[dict]:
        """Get ring radii for calibrated camera"""
        if camera_id in self.calibrations:
            return self.calibrations[camera_id]['ring_radii']
        return None
    
    def draw_board_overlay(self, frame: np.ndarray, camera_id: int) -> np.ndarray:
        """Draw dartboard rings on transformed frame"""
        if not self.is_calibrated(camera_id):
            return frame
        
        overlay = frame.copy()
        center = self.board_center
        radii = self.ring_radii
        
        # Draw rings
        cv2.circle(overlay, center, radii['double_outer'], (255, 255, 0), 2)
        cv2.circle(overlay, center, radii['double_inner'], (255, 255, 0), 2)
        cv2.circle(overlay, center, radii['triple_outer'], (0, 255, 0), 2)
        cv2.circle(overlay, center, radii['triple_inner'], (0, 255, 0), 2)
        cv2.circle(overlay, center, radii['bull_outer'], (0, 0, 255), 2)
        cv2.circle(overlay, center, radii['bull_inner'], (0, 0, 255), 2)
        
        # Draw center crosshair
        cv2.drawMarker(overlay, center, (255, 0, 0), cv2.MARKER_CROSS, 10, 2)
        
        return overlay
    
    def clear_calibration(self, camera_id: int):
        """Clear calibration for specific camera"""
        if camera_id in self.calibrations:
            del self.calibrations[camera_id]
            logger.info(f"Cleared calibration for camera {camera_id}")
            
            # Delete from database
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute('DELETE FROM camera_calibration WHERE camera_id = ?', (camera_id,))
                conn.commit()
                conn.close()
                logger.info(f"Deleted calibration from database for camera {camera_id}")
            except Exception as e:
                logger.error(f"Failed to delete calibration from database: {e}")