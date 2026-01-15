"""
Camera Manager
Handles camera access and configuration for dart detection.
"""
import cv2
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class CameraManager:
    """Manages camera devices and their configuration"""
    
    def __init__(self):
        self.cameras: dict[int, cv2.VideoCapture] = {}
    
    def get_available_cameras(self, max_index: int = 10) -> list[int]:
        """
        Scan for available camera devices.
        Returns list of camera indices that can be opened.
        """
        available = []
        
        for i in range(max_index):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                available.append(i)
                cap.release()
        
        logger.info(f"Found {len(available)} available cameras: {available}")
        return available
    
    def open_camera(self, index: int, width: int = 640, height: int = 480, fps: int = 30) -> cv2.VideoCapture:
        """
        Open a camera device with specified settings.
        
        Args:
            index: Camera device index (0, 1, 2, etc.)
            width: Frame width
            height: Frame height
            fps: Target frames per second
            
        Returns:
            VideoCapture object
        """
        if index in self.cameras:
            logger.warning(f"Camera {index} already open")
            return self.cameras[index]
        
        logger.info(f"Opening camera {index} at {width}x{height} @ {fps}fps")
        
        cap = cv2.VideoCapture(index)
        
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open camera {index}")
        
        # Set resolution
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        cap.set(cv2.CAP_PROP_FPS, fps)
        
        # Try to reduce exposure for better dart detection
        # (lower exposure = less motion blur)
        cap.set(cv2.CAP_PROP_EXPOSURE, -6)  # Manual exposure
        
        # Verify settings
        actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        actual_fps = int(cap.get(cv2.CAP_PROP_FPS))
        
        logger.info(f"Camera {index} opened: {actual_width}x{actual_height} @ {actual_fps}fps")
        
        self.cameras[index] = cap
        return cap
    
    def read_frame(self, index: int) -> Optional[tuple[bool, any]]:
        """
        Read a frame from the specified camera.
        
        Returns:
            (success, frame) tuple, or None if camera not open
        """
        if index not in self.cameras:
            logger.error(f"Camera {index} not open")
            return None
        
        return self.cameras[index].read()
    
    def release_camera(self, index: int):
        """Release a specific camera"""
        if index in self.cameras:
            self.cameras[index].release()
            del self.cameras[index]
            logger.info(f"Released camera {index}")
    
    def release_all(self):
        """Release all cameras"""
        for index in list(self.cameras.keys()):
            self.release_camera(index)
        logger.info("Released all cameras")
    
    def is_camera_open(self, index: int) -> bool:
        """Check if a camera is currently open"""
        return index in self.cameras and self.cameras[index].isOpened()


class CameraCalibration:
    """Store camera calibration data (future use for lens distortion correction)"""
    
    def __init__(self, camera_matrix=None, dist_coeffs=None):
        self.camera_matrix = camera_matrix
        self.dist_coeffs = dist_coeffs
    
    def undistort(self, image):
        """Apply lens distortion correction to an image"""
        if self.camera_matrix is None or self.dist_coeffs is None:
            return image
        
        return cv2.undistort(image, self.camera_matrix, self.dist_coeffs)
