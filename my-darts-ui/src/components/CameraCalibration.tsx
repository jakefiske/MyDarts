import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useThemeContext';
import config from '../config';

interface CalibrationPoint {
  x: number;
  y: number;
  label: string;
}

interface CameraCalibrationProps {
  cameraId: number;
  onCalibrated: () => void;
  onCancel: () => void;
}

const CameraCalibration: React.FC<CameraCalibrationProps> = ({ 
  cameraId, 
  onCalibrated, 
  onCancel 
}) => {
  const { theme } = useTheme();
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [points, setPoints] = useState<CalibrationPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const instructions = [
    { step: 1, text: 'Click on the BULLSEYE CENTER', highlight: 'bull' },
    { step: 2, text: 'Click on OUTER DOUBLE at 12 o\'clock (top)', highlight: 'top' },
    { step: 3, text: 'Click on OUTER DOUBLE at 3 o\'clock (right)', highlight: 'right' }
  ];

  useEffect(() => {
    loadSnapshot();
  }, [cameraId]);

  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/calibrate/${cameraId}/snapshot`);
      const data = await response.json();
      
      if (data.image) {
        setSnapshot(`data:image/jpeg;base64,${data.image}`);
        setImageDimensions({ width: data.width, height: data.height });
      } else {
        setError(data.error || 'Failed to load snapshot');
      }
    } catch (err) {
      setError('Failed to connect to detection service');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (points.length >= 3 || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;
    
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    const labels = ['Bullseye', 'Top (12 o\'clock)', 'Right (3 o\'clock)'];
    
    setPoints([...points, { x, y, label: labels[points.length] }]);
  };

  const handleCalibrate = async () => {
    if (points.length !== 3) return;

    setCalibrating(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiBaseUrl}/calibrate/${cameraId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center_x: points[0].x,
          center_y: points[0].y,
          top_x: points[1].x,
          top_y: points[1].y,
          right_x: points[2].x,
          right_y: points[2].y
        })
      });

      const data = await response.json();

      if (data.status === 'calibrated') {
        // Load preview
        await loadPreview();
        setTimeout(() => {
          onCalibrated();
        }, 2000);
      } else {
        setError(data.message || 'Calibration failed');
        setCalibrating(false);
      }
    } catch (err) {
      setError('Failed to calibrate camera');
      setCalibrating(false);
    }
  };

  const loadPreview = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/calibrate/${cameraId}/preview`);
      const data = await response.json();
      
      if (data.image) {
        setPreviewImage(`data:image/jpeg;base64,${data.image}`);
      }
    } catch (err) {
      console.error('Failed to load preview:', err);
    }
  };

  const handleReset = () => {
    setPoints([]);
    setPreviewImage(null);
    setError(null);
  };

  const currentInstruction = points.length < 3 ? instructions[points.length] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div 
        className="max-w-4xl w-full mx-4 rounded-2xl border-2 p-6"
        style={{
          background: theme.backgrounds.cardHex,
          borderColor: theme.borders.primary
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-2xl font-bold"
            style={{ 
              color: theme.text.primary,
              fontFamily: theme.fonts.display
            }}
          >
            Calibrate Camera {cameraId}
          </h2>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border-2 font-bold transition"
            style={{
              background: theme.backgrounds.baseHex,
              borderColor: theme.borders.secondary,
              color: theme.text.primary
            }}
          >
            Cancel
          </button>
        </div>

        {/* Error */}
        {error && (
          <div 
            className="mb-4 p-4 rounded-lg border-2"
            style={{
              background: `${theme.stateColors.error.color}20`,
              borderColor: theme.borders.primary,
              color: theme.text.primary
            }}
          >
            {error}
          </div>
        )}

        {/* Instructions */}
        {currentInstruction && !previewImage && (
          <div 
            className="mb-4 p-4 rounded-lg border-2"
            style={{
              background: `${theme.stateColors.active.color}20`,
              borderColor: theme.stateColors.active.border
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl"
                style={{
                  background: theme.stateColors.active.color,
                  color: theme.text.primary
                }}
              >
                {currentInstruction.step}
              </div>
              <p 
                className="text-lg font-bold"
                style={{ color: theme.text.primary }}
              >
                {currentInstruction.text}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera View */}
          <div>
            <h3 
              className="text-lg font-bold mb-3"
              style={{ color: theme.text.primary }}
            >
              Camera View
            </h3>
            <div 
              className="relative border-2 rounded-lg overflow-hidden"
              style={{ borderColor: theme.borders.primary }}
            >
              {loading ? (
                <div className="w-full h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2"
                       style={{ borderColor: theme.stateColors.active.color }} />
                </div>
              ) : snapshot ? (
                <>
                  <img
                    ref={imageRef}
                    src={snapshot}
                    alt="Camera snapshot"
                    className="w-full cursor-crosshair"
                    onClick={handleImageClick}
                    style={{ 
                      cursor: points.length >= 3 ? 'default' : 'crosshair'
                    }}
                  />
                  {/* Draw points */}
                  {points.map((point, idx) => {
                    if (!imageRef.current) return null;
                    const rect = imageRef.current.getBoundingClientRect();
                    const displayX = (point.x / imageDimensions.width) * rect.width;
                    const displayY = (point.y / imageDimensions.height) * rect.height;
                    
                    return (
                      <div
                        key={idx}
                        className="absolute w-6 h-6 rounded-full border-4 -translate-x-3 -translate-y-3 flex items-center justify-center font-bold text-xs"
                        style={{
                          left: `${displayX}px`,
                          top: `${displayY}px`,
                          background: theme.stateColors.active.color,
                          borderColor: 'white',
                          color: theme.text.primary
                        }}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="w-full h-96 flex items-center justify-center"
                     style={{ color: theme.text.secondary }}>
                  Failed to load camera
                </div>
              )}
            </div>
          </div>

          {/* Instructions Visual */}
          <div>
            <h3 
              className="text-lg font-bold mb-3"
              style={{ color: theme.text.primary }}
            >
              {previewImage ? 'Calibrated View' : 'Click Points'}
            </h3>
            
            {previewImage ? (
              <div className="border-2 rounded-lg overflow-hidden"
                   style={{ borderColor: theme.borders.primary }}>
                <img src={previewImage} alt="Calibrated preview" className="w-full" />
              </div>
            ) : (
              <svg viewBox="0 0 400 400" className="w-full">
                {/* Dartboard simplified */}
                <circle cx="200" cy="200" r="180" fill="none" stroke={theme.borders.secondary} strokeWidth="2" />
                <circle cx="200" cy="200" r="160" fill="none" stroke={theme.borders.secondary} strokeWidth="1" />
                <circle cx="200" cy="200" r="107" fill="none" stroke={theme.stateColors.success.color} strokeWidth="3" />
                <circle cx="200" cy="200" r="16" fill="none" stroke={theme.categoryColors.bull.color} strokeWidth="2" />
                
                {/* Point 1: Center */}
                <circle 
                  cx="200" 
                  cy="200" 
                  r="8" 
                  fill={points.length >= 1 ? theme.stateColors.success.color : theme.stateColors.active.color}
                  opacity={currentInstruction?.highlight === 'bull' ? 1 : 0.3}
                />
                <text x="200" y="230" textAnchor="middle" fontSize="12" fill={theme.text.primary}>
                  1. Bullseye
                </text>
                
                {/* Point 2: Top */}
                <circle 
                  cx="200" 
                  cy="20" 
                  r="8" 
                  fill={points.length >= 2 ? theme.stateColors.success.color : theme.stateColors.active.color}
                  opacity={currentInstruction?.highlight === 'top' ? 1 : 0.3}
                />
                <text x="200" y="15" textAnchor="middle" fontSize="12" fill={theme.text.primary}>
                  2. Top
                </text>
                
                {/* Point 3: Right */}
                <circle 
                  cx="380" 
                  cy="200" 
                  r="8" 
                  fill={points.length >= 3 ? theme.stateColors.success.color : theme.stateColors.active.color}
                  opacity={currentInstruction?.highlight === 'right' ? 1 : 0.3}
                />
                <text x="385" y="205" textAnchor="start" fontSize="12" fill={theme.text.primary}>
                  3. Right
                </text>
              </svg>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          {points.length > 0 && !previewImage && (
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-lg border-2 font-bold transition"
              style={{
                background: theme.backgrounds.baseHex,
                borderColor: theme.borders.secondary,
                color: theme.text.primary
              }}
            >
              Reset Points
            </button>
          )}
          
          {points.length === 3 && !previewImage && (
            <button
              onClick={handleCalibrate}
              disabled={calibrating}
              className="px-6 py-3 rounded-lg border-2 font-bold transition"
              style={{
                background: calibrating ? theme.backgrounds.baseHex : theme.stateColors.success.color,
                borderColor: theme.stateColors.success.border,
                color: theme.text.primary,
                opacity: calibrating ? 0.5 : 1
              }}
            >
              {calibrating ? 'Calibrating...' : 'Calibrate Camera'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCalibration;