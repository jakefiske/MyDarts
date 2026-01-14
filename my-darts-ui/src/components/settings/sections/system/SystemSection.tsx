import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';
import { KioskModeCard } from './KioskModeCard';
import { StatusCard } from './StatusCard';
import { ServicesCard } from './ServicesCard';
import { SoftwareCard } from './SoftwareCard';
import { DisplayCard } from './DisplayCard';
import { PowerCard } from './PowerCard';

interface SystemStatus {
  platform: string;
  hostname: string;
  connected: boolean;
  internet: boolean;
  ipAddresses: string[];
  orientation: string;
  wifi?: { ssid?: string; signal?: string };
}

interface VersionInfo {
  commit: string;
  date: string;
  branch: string;
}

interface ServiceStatuses {
  autodarts: boolean;
  dartsCaller: boolean;
}

export const SystemSection: React.FC = () => {
  const { theme } = useTheme();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatuses>({
    autodarts: false,
    dartsCaller: false
  });
  const [loading, setLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  }, []);

  const fetchVersion = useCallback(async () => {
    try {
      const res = await fetch('/api/system/version');
      const data = await res.json();
      setVersion(data);
    } catch (err) {
      console.error('Failed to fetch version:', err);
    }
  }, []);

  const fetchServiceStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/system/services');
      const data = await res.json();
      setServiceStatuses(data);
    } catch (err) {
      console.error('Failed to fetch service statuses:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchVersion();
    fetchServiceStatuses();
    
    // Poll service status every 5 seconds
    const interval = setInterval(fetchServiceStatuses, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchVersion, fetchServiceStatuses]);

  const handleReboot = async () => {
    if (!window.confirm('Reboot now?')) return;
    setLoading(true);
    try {
      await fetch('/api/system/reboot', { method: 'POST' });
    } catch (err) {}
    setLoading(false);
  };

  const handleShutdown = async () => {
    if (!window.confirm('Shutdown now?')) return;
    setLoading(true);
    try {
      await fetch('/api/system/shutdown', { method: 'POST' });
    } catch (err) {}
    setLoading(false);
  };

  const handleRotate = async (orientation: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/system/rotate?orientation=${orientation}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSystemStatus(prev => prev ? { ...prev, orientation } : null);
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!window.confirm('Pull latest from GitHub and restart?')) return;
    setLoading(true);
    setUpdateStatus('Updating...');
    try {
      const res = await fetch('/api/system/update', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUpdateStatus('Update complete! Restarting...');
      } else {
        setUpdateStatus(`Failed: ${data.message}`);
      }
    } catch (err) {
      setUpdateStatus('Update failed');
    }
    setLoading(false);
  };

  const handleRunSetup = async () => {
    if (!window.confirm('Run Pi setup script? This will install dependencies and configure services.')) return;
    setLoading(true);
    setUpdateStatus('Running setup...');
    try {
      const res = await fetch('/api/system/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUpdateStatus('✓ Setup complete!');
      } else {
        setUpdateStatus(`Setup failed: ${data.message}`);
      }
    } catch (err) {
      setUpdateStatus('Setup failed');
    }
    setLoading(false);
  };

  const handleServiceAction = async (service: string, action: string) => {
    if (action === 'logs') {
      window.open(`/api/system/service-logs?service=${service}`, '_blank');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/system/service/${service}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUpdateStatus(`✓ ${service} ${action} successful`);
        setTimeout(() => fetchServiceStatuses(), 1000);
      } else {
        setUpdateStatus(`✗ ${service} ${action} failed: ${data.message}`);
      }
    } catch (err) {
      setUpdateStatus(`✗ ${service} ${action} failed`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>System</h2>
      
      <KioskModeCard />
      <StatusCard systemStatus={systemStatus} />
      <ServicesCard 
        serviceStatuses={serviceStatuses}
        loading={loading}
        onServiceAction={handleServiceAction}
      />
      <SoftwareCard
        version={version}
        loading={loading}
        updateStatus={updateStatus}
        onUpdate={handleUpdate}
        onRunSetup={handleRunSetup}
      />
      <DisplayCard
        systemStatus={systemStatus}
        loading={loading}
        onRotate={handleRotate}
      />
      <PowerCard
        loading={loading}
        onReboot={handleReboot}
        onShutdown={handleShutdown}
      />
    </div>
  );
};

export { SystemSection as default };