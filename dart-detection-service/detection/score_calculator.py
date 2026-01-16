"""
Score Calculator
Converts dart tip position (in board coordinates) to score using polar coordinates.
Based on standard dartboard geometry.
"""
import math
import numpy as np
import logging
from typing import Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ScoreResult:
    """Result of score calculation"""
    segment: str  # e.g. 'T20', 'D16', '5', 'BULL', '25'
    value: int
    multiplier: int
    radius: float  # Distance from center
    angle: float   # Angle in degrees


class ScoreCalculator:
    """
    Calculate dart score from (x, y) position on dartboard.
    
    Uses polar coordinates (radius, angle) and dartboard geometry.
    """
    
    # Dartboard segment order (clockwise from top)
    SEGMENTS = [
        20, 1, 18, 4, 13, 6, 10, 15, 2, 17,
        3, 19, 7, 16, 8, 11, 14, 9, 12, 5
    ]
    
    # Segment angles (degrees, starting from vertical top)
    # Each segment is 18° wide, first segment (20) is split at top
    SEGMENT_ANGLES = {
        20: (351, 9),     # Split across 0°
        1: (9, 27),
        18: (27, 45),
        4: (45, 63),
        13: (63, 81),
        6: (81, 99),
        10: (99, 117),
        15: (117, 135),
        2: (135, 153),
        17: (153, 171),
        3: (171, 189),
        19: (189, 207),
        7: (207, 225),
        16: (225, 243),
        8: (243, 261),
        11: (261, 279),
        14: (279, 297),
        9: (297, 315),
        12: (315, 333),
        5: (333, 351)
    }
    
    def __init__(
        self,
        center: Tuple[int, int],
        ring_radii: dict
    ):
        """
        Initialize calculator with board geometry.
        
        Args:
            center: (x, y) center of dartboard in transformed image
            ring_radii: Dict with keys: bull_inner, bull_outer, triple_inner, 
                       triple_outer, double_inner, double_outer
        """
        self.center = center
        self.radii = ring_radii
    
    def calculate_polar(
        self, 
        x: int, 
        y: int
    ) -> Tuple[float, float]:
        """
        Convert (x, y) to polar coordinates (radius, angle).
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            (radius, angle_degrees)
        """
        # Calculate radius
        dx = x - self.center[0]
        dy = y - self.center[1]
        radius = math.sqrt(dx*dx + dy*dy)
        
        # Calculate angle (0° at top, clockwise)
        # atan2 gives angle from positive x-axis, counterclockwise
        # We need to convert to clockwise from top
        angle_rad = math.atan2(dy, dx)
        angle_deg = math.degrees(angle_rad)
        
        # Convert to clockwise from top: 0° = top, 90° = right
        angle_deg = (90 - angle_deg) % 360
        
        return radius, angle_deg
    
    def get_segment_from_angle(self, angle: float) -> int:
        """
        Get dartboard segment number from angle.
        
        Args:
            angle: Angle in degrees (0-360, 0 = top)
            
        Returns:
            Segment number (1-20)
        """
        for segment, (start, end) in self.SEGMENT_ANGLES.items():
            if start > end:  # Wraps around 0° (segment 20)
                if angle >= start or angle < end:
                    return segment
            else:
                if start <= angle < end:
                    return segment
        
        # Fallback (shouldn't happen)
        logger.warning(f"No segment found for angle {angle}")
        return 20
    
    def calculate_score(
        self,
        x: int,
        y: int
    ) -> ScoreResult:
        """
        Calculate score from dart position.
        
        Args:
            x: X coordinate in board space
            y: Y coordinate in board space
            
        Returns:
            ScoreResult with segment, value, multiplier
        """
        radius, angle = self.calculate_polar(x, y)
        
        # Check special cases first
        if radius <= self.radii['bull_inner']:
            return ScoreResult(
                segment='BULL',
                value=50,
                multiplier=1,
                radius=radius,
                angle=angle
            )
        
        if radius <= self.radii['bull_outer']:
            return ScoreResult(
                segment='25',
                value=25,
                multiplier=1,
                radius=radius,
                angle=angle
            )
        
        # Outside board
        if radius > self.radii['double_outer']:
            return ScoreResult(
                segment='0',
                value=0,
                multiplier=1,
                radius=radius,
                angle=angle
            )
        
        # Get segment number from angle
        segment_num = self.get_segment_from_angle(angle)
        
        # Determine multiplier from radius
        multiplier = 1  # Single by default
        
        if self.radii['triple_inner'] <= radius <= self.radii['triple_outer']:
            multiplier = 3
        elif self.radii['double_inner'] <= radius <= self.radii['double_outer']:
            multiplier = 2
        
        # Build segment string
        if multiplier == 3:
            segment = f'T{segment_num}'
        elif multiplier == 2:
            segment = f'D{segment_num}'
        else:
            segment = str(segment_num)
        
        return ScoreResult(
            segment=segment,
            value=segment_num,
            multiplier=multiplier,
            radius=radius,
            angle=angle
        )
    
    def calculate_score_with_tip_compensation(
        self,
        x: int,
        y: int,
        compensation_factor: float = 0.215
    ) -> ScoreResult:
        """
        Calculate score with dart tip compensation.
        
        The visible dart tip is offset from where it actually hits the board.
        We compensate by moving the point along the vector from center.
        
        Args:
            x: X coordinate
            y: Y coordinate
            compensation_factor: How much to compensate (0.215 is typical)
            
        Returns:
            ScoreResult
        """
        # Calculate vector from center to tip
        dx = x - self.center[0]
        dy = y - self.center[1]
        
        # Apply compensation along this vector
        compensated_x = x + dx * compensation_factor
        compensated_y = y + dy * compensation_factor
        
        return self.calculate_score(int(compensated_x), int(compensated_y))
