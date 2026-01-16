"""
Triangle Dart Tip Detector
Finds dart tips using triangle fitting on contours.
Based on LarsG21/Darts_Project approach with optimizations.
"""
import cv2
import numpy as np
import logging
from typing import Optional, Tuple, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class DartDetection:
    """Single dart detection result"""
    tip_x: int
    tip_y: int
    confidence: float
    contour_area: float
    triangle_points: Optional[np.ndarray] = None


class TriangleDartDetector:
    """
    Detects dart tips by fitting triangles to contours.
    
    The dart shaft creates a triangular shape in difference images.
    We find the tip by identifying the point opposite the shortest side.
    """
    
    def __init__(
        self,
        min_area: int = 100,
        max_area: int = 5000,
        canny_low: int = 50,
        canny_high: int = 150,
        gauss_filters: int = 2,
        dilations: int = 6,
        erosions: int = 2
    ):
        """
        Initialize detector with filtering parameters.
        
        Args:
            min_area: Minimum contour area (pixels)
            max_area: Maximum contour area (pixels)
            canny_low: Canny edge detection low threshold
            canny_high: Canny edge detection high threshold
            gauss_filters: Number of Gaussian blur passes
            dilations: Dilation iterations
            erosions: Erosion iterations
        """
        self.min_area = min_area
        self.max_area = max_area
        self.canny_low = canny_low
        self.canny_high = canny_high
        self.gauss_filters = gauss_filters
        self.dilations = dilations
        self.erosions = erosions
    
    def find_contours(self, diff_image: np.ndarray) -> List[np.ndarray]:
        """
        Find contours in difference image using Canny edge detection.
        
        Args:
            diff_image: Grayscale difference image
            
        Returns:
            List of contours (each is numpy array of points)
        """
        # Apply Gaussian blur to reduce noise
        blurred = diff_image.copy()
        for _ in range(self.gauss_filters):
            blurred = cv2.GaussianBlur(blurred, (11, 11), 1)
        
        # Canny edge detection
        edges = cv2.Canny(blurred, self.canny_low, self.canny_high)
        
        # Morphological operations to close gaps
        kernel = np.ones((3, 3), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=self.dilations)
        processed = cv2.erode(dilated, kernel, iterations=self.erosions)
        
        # Find contours
        contours, _ = cv2.findContours(
            processed, 
            cv2.RETR_EXTERNAL, 
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        # Filter by area
        filtered = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if self.min_area < area < self.max_area:
                filtered.append(contour)
        
        # Sort by area (largest first)
        filtered.sort(key=cv2.contourArea, reverse=True)
        
        return filtered
    
    def fit_triangle(self, contour: np.ndarray) -> Optional[np.ndarray]:
        """
        Approximate contour as triangle using polynomial approximation.
        
        Args:
            contour: Contour points
            
        Returns:
            Triangle corners as 3x2 array, or None if can't fit triangle
        """
        # Approximate contour with polygon
        epsilon = 0.01 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        # Check if we have exactly 3 corners (triangle)
        if len(approx) == 3:
            return approx.reshape(3, 2)
        
        # If more than 3 corners, try tighter approximation
        if len(approx) > 3:
            epsilon = 0.02 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            if len(approx) == 3:
                return approx.reshape(3, 2)
        
        # Couldn't get clean triangle - return None
        return None
    
    def find_dart_tip(self, triangle: np.ndarray) -> Tuple[np.ndarray, List[np.ndarray]]:
        """
        Find the tip of the dart from triangle corners.
        
        The tip is the corner opposite the shortest side (the base of the dart shaft).
        
        Args:
            triangle: 3x2 array of triangle corners
            
        Returns:
            (tip_point, [base_point1, base_point2])
        """
        pt1, pt2, pt3 = triangle
        
        # Calculate distances between all points
        dist_1_2 = np.linalg.norm(pt1 - pt2)
        dist_1_3 = np.linalg.norm(pt1 - pt3)
        dist_2_3 = np.linalg.norm(pt2 - pt3)
        
        # Find shortest distance (base of triangle)
        # Tip is opposite corner
        if dist_2_3 < dist_1_2 and dist_2_3 < dist_1_3:
            # Base is pt2-pt3, tip is pt1
            return pt1, [pt2, pt3]
        elif dist_1_3 < dist_1_2 and dist_1_3 < dist_2_3:
            # Base is pt1-pt3, tip is pt2
            return pt2, [pt1, pt3]
        else:
            # Base is pt1-pt2, tip is pt3
            return pt3, [pt1, pt2]
    
    def detect_dart(
        self, 
        diff_image: np.ndarray,
        top_n: int = 3
    ) -> List[DartDetection]:
        """
        Detect dart tip in difference image.
        
        Args:
            diff_image: Grayscale difference from reference
            top_n: Number of top candidates to return
            
        Returns:
            List of DartDetection objects, sorted by confidence
        """
        contours = self.find_contours(diff_image)
        
        if not contours:
            return []
        
        detections = []
        
        # Try to fit triangles to top contours
        for contour in contours[:top_n * 2]:  # Check more than needed
            triangle = self.fit_triangle(contour)
            
            if triangle is not None:
                # Find dart tip
                tip, base = self.find_dart_tip(triangle)
                
                # Calculate confidence based on contour area and triangle quality
                area = cv2.contourArea(contour)
                
                # Triangle quality: how well does it approximate the contour?
                # Perfect triangle should have area close to contour area
                triangle_area = cv2.contourArea(triangle.reshape(-1, 1, 2))
                area_ratio = min(area, triangle_area) / max(area, triangle_area)
                
                confidence = area_ratio * min(1.0, area / 1000.0)
                
                detections.append(DartDetection(
                    tip_x=int(tip[0]),
                    tip_y=int(tip[1]),
                    confidence=confidence,
                    contour_area=area,
                    triangle_points=triangle
                ))
        
        # Sort by confidence
        detections.sort(key=lambda d: d.confidence, reverse=True)
        
        return detections[:top_n]
    
    def visualize_detection(
        self,
        frame: np.ndarray,
        detection: DartDetection,
        color: Tuple[int, int, int] = (0, 255, 0)
    ) -> np.ndarray:
        """
        Draw detection on frame for debugging.
        
        Args:
            frame: Frame to draw on
            detection: Detection to visualize
            color: RGB color for drawing
            
        Returns:
            Frame with detection drawn
        """
        vis = frame.copy()
        
        # Draw triangle
        if detection.triangle_points is not None:
            pts = detection.triangle_points.astype(np.int32)
            cv2.polylines(vis, [pts], True, color, 2)
        
        # Draw tip
        cv2.circle(vis, (detection.tip_x, detection.tip_y), 5, (0, 0, 255), -1)
        
        # Draw confidence text
        text = f"Conf: {detection.confidence:.2f}"
        cv2.putText(
            vis, text,
            (detection.tip_x + 10, detection.tip_y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5, color, 1
        )
        
        return vis
