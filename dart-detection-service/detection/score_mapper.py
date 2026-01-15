"""
Score Mapper
Maps pixel coordinates from camera to dartboard scores.
"""
import numpy as np
import logging

logger = logging.getLogger(__name__)


class ScoreMapper:
    """
    Maps camera pixel coordinates to dartboard scores.
    Uses calibration points to create transformation matrix.
    """
    
    # Dartboard layout (standard configuration)
    DARTBOARD_NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
    
    # Dartboard dimensions (in mm)
    DOUBLE_RING_OUTER = 170  # Outer edge of double ring
    DOUBLE_RING_INNER = 162  # Inner edge of double ring
    TRIPLE_RING_OUTER = 107  # Outer edge of triple ring
    TRIPLE_RING_INNER = 99   # Inner edge of triple ring
    BULL_OUTER = 15.9         # Outer bull (single bull)
    BULL_INNER = 6.35         # Inner bull (double bull)
    
    def __init__(self, calibration_points: list[dict] = None):
        """
        Initialize score mapper with calibration points.
        
        Args:
            calibration_points: List of calibration points with pixel coordinates
                               and corresponding board positions
        """
        self.calibration_points = calibration_points or []
        self.transformation_matrix = None
        
        if calibration_points:
            self._compute_transformation()
    
    def _compute_transformation(self):
        """
        Compute transformation matrix from calibration points.
        Maps pixel coordinates to dartboard coordinate system.
        """
        # TODO: Implement proper perspective transformation
        # For now, just log that we have calibration
        logger.info(f"Calibration set with {len(self.calibration_points)} points")
        # This would involve cv2.getPerspectiveTransform() with known board points
    
    def pixel_to_score(self, x: int, y: int, camera_index: int = 0) -> dict:
        """
        Convert pixel coordinates to dartboard score.
        
        Args:
            x: Pixel x coordinate
            y: Pixel y coordinate
            camera_index: Which camera the coordinates came from
            
        Returns:
            dict with segment, value, multiplier
        """
        # TODO: Implement actual transformation
        # For now, return dummy data for testing
        
        # This is where you would:
        # 1. Apply transformation matrix to get board coordinates
        # 2. Calculate distance from center (radius)
        # 3. Calculate angle to determine which number
        # 4. Use radius to determine single/double/triple/bull
        
        # PLACEHOLDER: Return random-ish score based on pixel position
        # This lets you test the rest of the system
        
        # Simple mapping for testing
        angle = np.arctan2(y - 240, x - 320)  # Assuming 640x480 center
        radius = np.sqrt((x - 320)**2 + (y - 240)**2)
        
        # Map angle to dartboard number
        angle_deg = (np.degrees(angle) + 360) % 360
        number_index = int((angle_deg + 9) // 18) % 20
        number = self.DARTBOARD_NUMBERS[number_index]
        
        # Map radius to multiplier
        if radius < 30:  # Bull
            return {
                'segment': 'DB' if radius < 15 else 'SB',
                'value': 25,
                'multiplier': 2 if radius < 15 else 1
            }
        elif radius > 150:  # Double
            multiplier = 2
            segment = f'D{number}'
        elif 80 < radius < 100:  # Triple
            multiplier = 3
            segment = f'T{number}'
        else:  # Single
            multiplier = 1
            segment = f'S{number}'
        
        return {
            'segment': segment,
            'value': number,
            'multiplier': multiplier
        }
    
    def calibrate_from_points(self, points: list[dict]):
        """
        Perform calibration from a set of known points.
        
        Args:
            points: List of dicts with 'pixel_x', 'pixel_y', 'board_x', 'board_y'
        """
        # TODO: Implement calibration algorithm
        # This would involve:
        # 1. Collect pairs of (pixel coords, real board coords)
        # 2. Use cv2.getPerspectiveTransform() or similar
        # 3. Store transformation matrix
        self.calibration_points = points
        self._compute_transformation()
        logger.info(f"Calibrated with {len(points)} points")


class BoardGeometry:
    """Helper class for dartboard geometry calculations"""
    
    @staticmethod
    def angle_to_number(angle_degrees: float) -> int:
        """Convert angle (0-360°) to dartboard number"""
        # Dartboard starts at 20 (top), goes clockwise
        numbers = ScoreMapper.DARTBOARD_NUMBERS
        # Offset by 9 degrees (half a segment) and divide by 18 degrees per segment
        index = int((angle_degrees + 9) // 18) % 20
        return numbers[index]
    
    @staticmethod
    def distance_to_multiplier(distance_mm: float) -> tuple[int, str]:
        """
        Convert distance from center to multiplier.
        
        Returns:
            (multiplier, zone_name) where zone is 'bull', 'single', 'triple', 'double', or 'miss'
        """
        if distance_mm < ScoreMapper.BULL_INNER:
            return (2, 'double_bull')
        elif distance_mm < ScoreMapper.BULL_OUTER:
            return (1, 'single_bull')
        elif distance_mm < ScoreMapper.TRIPLE_RING_INNER:
            return (1, 'inner_single')
        elif distance_mm < ScoreMapper.TRIPLE_RING_OUTER:
            return (3, 'triple')
        elif distance_mm < ScoreMapper.DOUBLE_RING_INNER:
            return (1, 'outer_single')
        elif distance_mm < ScoreMapper.DOUBLE_RING_OUTER:
            return (2, 'double')
        else:
            return (0, 'miss')
