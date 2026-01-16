"""
Multi-Camera Fusion
Combines detections from multiple cameras for higher accuracy.
Uses mode-based voting when multiple cameras detect the same dart.
"""
import logging
from typing import List, Optional
from dataclasses import dataclass
from collections import Counter

logger = logging.getLogger(__name__)


@dataclass
class CameraDetection:
    """Detection from a single camera"""
    camera_id: int
    segment: str
    value: int
    multiplier: int
    confidence: float
    x: int  # Board coordinates
    y: int  # Board coordinates


@dataclass
class FusedDetection:
    """Final detection after fusing multiple cameras"""
    segment: str
    value: int
    multiplier: int
    confidence: float
    num_cameras: int
    agreement: float  # 0.0 to 1.0, how many cameras agree


class MultiCameraFusion:
    """
    Fuses detections from multiple cameras.
    
    Strategies:
    1. Mode voting: Most common result wins
    2. Confidence weighting: Higher confidence cameras weighted more
    3. Agreement scoring: How well cameras agree
    """
    
    def __init__(
        self,
        min_agreement: float = 0.5,
        confidence_threshold: float = 0.3,
        sample_frames: int = 20
    ):
        """
        Initialize fusion system.
        
        Args:
            min_agreement: Minimum agreement fraction to accept result
            confidence_threshold: Minimum confidence to consider detection
            sample_frames: Number of frames to sample for mode calculation
        """
        self.min_agreement = min_agreement
        self.confidence_threshold = confidence_threshold
        self.sample_frames = sample_frames
        
        # Buffer for sampling multiple frames
        self.detection_buffer: List[List[CameraDetection]] = []
    
    def add_detections(self, detections: List[CameraDetection]):
        """
        Add detections from current frame to buffer.
        
        Args:
            detections: List of detections from all cameras
        """
        # Filter low confidence
        filtered = [
            d for d in detections 
            if d.confidence >= self.confidence_threshold
        ]
        
        if filtered:
            self.detection_buffer.append(filtered)
        
        # Keep buffer size limited
        if len(self.detection_buffer) > self.sample_frames:
            self.detection_buffer.pop(0)
    
    def get_fused_detection(self) -> Optional[FusedDetection]:
        """
        Get fused detection using mode-based voting across frames.
        
        Returns:
            FusedDetection or None if insufficient data
        """
        if len(self.detection_buffer) < self.sample_frames // 2:
            return None  # Not enough samples yet
        
        # Collect all segment results
        all_segments = []
        segment_confidences = {}
        
        for frame_detections in self.detection_buffer:
            for det in frame_detections:
                all_segments.append(det.segment)
                
                if det.segment not in segment_confidences:
                    segment_confidences[det.segment] = []
                segment_confidences[det.segment].append(det.confidence)
        
        if not all_segments:
            return None
        
        # Find mode (most common result)
        segment_counts = Counter(all_segments)
        most_common_segment, count = segment_counts.most_common(1)[0]
        
        # Calculate agreement
        total_detections = len(all_segments)
        agreement = count / total_detections
        
        # Check if agreement meets threshold
        if agreement < self.min_agreement:
            logger.debug(f"Low agreement: {agreement:.2f} < {self.min_agreement}")
            return None
        
        # Calculate average confidence for winning segment
        avg_confidence = sum(segment_confidences[most_common_segment]) / len(segment_confidences[most_common_segment])
        
        # Parse segment to get value and multiplier
        value, multiplier = self._parse_segment(most_common_segment)
        
        # Count unique cameras that detected this segment
        cameras_detected = set()
        for frame_detections in self.detection_buffer:
            for det in frame_detections:
                if det.segment == most_common_segment:
                    cameras_detected.add(det.camera_id)
        
        return FusedDetection(
            segment=most_common_segment,
            value=value,
            multiplier=multiplier,
            confidence=avg_confidence,
            num_cameras=len(cameras_detected),
            agreement=agreement
        )
    
    def _parse_segment(self, segment: str) -> tuple[int, int]:
        """
        Parse segment string to value and multiplier.
        
        Examples:
            'T20' -> (20, 3)
            'D16' -> (16, 2)
            '5' -> (5, 1)
            'BULL' -> (50, 1)
            '25' -> (25, 1)
        """
        if segment == 'BULL':
            return 50, 1
        if segment == '25':
            return 25, 1
        
        if segment.startswith('T'):
            return int(segment[1:]), 3
        elif segment.startswith('D'):
            return int(segment[1:]), 2
        else:
            return int(segment), 1
    
    def reset_buffer(self):
        """Clear detection buffer (call after dart confirmed)"""
        self.detection_buffer.clear()
    
    def instant_fusion(self, detections: List[CameraDetection]) -> Optional[FusedDetection]:
        """
        Fuse detections from single frame (when speed is critical).
        
        This is faster but less accurate than buffered mode voting.
        
        Args:
            detections: Detections from all cameras in current frame
            
        Returns:
            FusedDetection or None
        """
        # Filter low confidence
        filtered = [
            d for d in detections 
            if d.confidence >= self.confidence_threshold
        ]
        
        if not filtered:
            return None
        
        # Use highest confidence detection
        best = max(filtered, key=lambda d: d.confidence)
        
        # Calculate agreement (how many cameras see same segment)
        same_segment = [d for d in filtered if d.segment == best.segment]
        agreement = len(same_segment) / len(filtered)
        
        value, multiplier = self._parse_segment(best.segment)
        
        return FusedDetection(
            segment=best.segment,
            value=value,
            multiplier=multiplier,
            confidence=best.confidence,
            num_cameras=len(same_segment),
            agreement=agreement
        )
    
    def get_buffer_size(self) -> int:
        """Get current buffer size"""
        return len(self.detection_buffer)
