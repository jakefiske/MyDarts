import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import config from '../../config';
import CameraCalibration from '../CameraCalibration';

interface CalibrationStatus {
  calibrated_cameras: { camera_id: number }[];
  total_calibrated: number;
}

const DetectionCalibrationSettings: React.FC = () => {
  const { theme } = useTheme();
  const [status, setStatus] = useState<CalibrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [calibratingCamera, setCalibratingCamera] = useState<number | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/calibrate/status`);
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load calibration status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCalibration = async (cameraId: number) => {
    try {
      await fetch(`${config.apiBaseUrl}/calibrate/${cameraId}`, {
        method: 'DELETE'
      });
      loadStatus();
    } catch (err) {
      console.error('Failed to clear calibration:', err);
    }
  };

  const isCameraCalibrated = (cameraId: number) => {
    return status?.calibrated_cameras.some(c => c.camera_id === cameraId) || false;
  };

  const cameras = [0, 1, 2];

  return (
    <div className="p-6">
      <div 
        className="rounded-2xl border-2 p-6"
        style={{
          background: theme.backgrounds.cardHex,
          borderColor: theme.borders.primary
        }}
      >
        <h2 
          className="text-2xl font-bold mb-6"
          style={{ 
            color: theme.text.primary,
            fontFamily: theme.fonts.display
          }}
        >
          Camera Calibration
        </h2>

        <p 
          className="mb-6"
          style={{ color: theme.text.secondary }}
        >
          Calibrate each camera by clicking 3 points on the dartboard. This allows the detection
          system to accurately map dart positions to scores.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: theme.stateColors.active.color }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {cameras.map(cameraId => {
              const calibrated = isCameraCalibrated(cameraId);
              
              return (
                <div
                  key={cameraId}
                  className="p-4 rounded-lg border-2 flex items-center justify-between"
                  style={{
                    background: theme.backgrounds.baseHex,
                    borderColor: calibrated 
                      ? theme.stateColors.success.border 
                      : theme.borders.secondary
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
                      style={{
                        background: calibrated 
                          ? theme.stateColors.success.color 
                          : theme.backgrounds.cardHex,
                        color: theme.text.primary,
                        border: `2px solid ${calibrated ? theme.stateColors.success.border : theme.borders.secondary}`
                      }}
                    >
                      {cameraId}
                    </div>
                    
                    <div>
                      <h3 
                        className="font-bold text-lg"
                        style={{ color: theme.text.primary }}
                      >
                        Camera {cameraId}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ 
                          color: calibrated 
                            ? theme.stateColors.success.color 
                            : theme.text.secondary 
                        }}
                      >
                        {calibrated ? '✓ Calibrated' : 'Not calibrated'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {calibrated && (
                      <button
                        onClick={() => handleClearCalibration(cameraId)}
                        className="px-4 py-2 rounded-lg border-2 font-bold transition"
                        style={{
                          background: theme.backgrounds.baseHex,
                          borderColor: theme.stateColors.error.border,
                          color: theme.stateColors.error.color
                        }}
                      >
                        Clear
                      </button>
                    )}
                    
                    <button
                      onClick={() => setCalibratingCamera(cameraId)}
                      className="px-4 py-2 rounded-lg border-2 font-bold transition"
                      style={{
                        background: theme.stateColors.active.color,
                        borderColor: theme.stateColors.active.border,
                        color: theme.text.primary
                      }}
                    >
                      {calibrated ? 'Re-calibrate' : 'Calibrate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Status Summary */}
        {status && (
          <div 
            className="mt-6 p-4 rounded-lg border-2"
            style={{
              background: status.total_calibrated === 3 
                ? `${theme.stateColors.success.color}20`
                : `${theme.stateColors.warning.color}20`,
              borderColor: status.total_calibrated === 3
                ? theme.stateColors.success.border
                : theme.stateColors.warning.border
            }}
          >
            <p 
              className="font-bold"
              style={{ 
                color: status.total_calibrated === 3
                  ? theme.stateColors.success.color
                  : theme.stateColors.warning.color
              }}
            >
              {status.total_calibrated} of 3 cameras calibrated
            </p>
            {status.total_calibrated < 3 && (
              <p 
                className="text-sm mt-1"
                style={{ color: theme.text.secondary }}
              >
                Calibrate all 3 cameras for best detection accuracy.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Calibration Modal */}
      {calibratingCamera !== null && (
        <CameraCalibration
          cameraId={calibratingCamera}
          onCalibrated={() => {
            setCalibratingCamera(null);
            loadStatus();
          }}
          onCancel={() => setCalibratingCamera(null)}
        />
      )}
    </div>
  );
};

export default DetectionCalibrationSettings;