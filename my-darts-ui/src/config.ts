/**
 * Auto-detecting configuration system for MyDarts
 * 
 * This file automatically determines the correct URLs based on where the app is running.
 * No hardcoded IPs needed - works on any device, any network.
 */

export interface AppConfig {
  apiBaseUrl: string;
  dartsCallerUrl: string;
  isDevelopment: boolean;
}

/**
 * Detects if we're running in development mode (npm start) or production (built and served)
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Gets the current hostname (e.g., "192.168.86.250" or "localhost")
 */
const hostname = window.location.hostname;

/**
 * Gets the protocol (http or https)
 */
const protocol = window.location.protocol;

/**
 * Configuration that automatically adapts to the environment
 */
const config: AppConfig = {
  // API runs on port 5025 - use same host as the frontend
  apiBaseUrl: isDevelopment 
    ? 'http://localhost:5025'  // Development: API runs on localhost:5025
    : `${protocol}//${hostname}:5025`,  // Production: API runs on same host as frontend
  
  // Darts-caller always runs on the SAME MACHINE as the API (the Pi)
  // The backend will proxy to localhost:8079, so frontend just talks to backend
  dartsCallerUrl: isDevelopment
    ? 'http://localhost:5025/api/dartscaller/proxy'  // Proxy through our API
    : `${protocol}//${hostname}:5025/api/dartscaller/proxy`,
  
  isDevelopment
};

/**
 * Gets the default darts-caller URL for direct connection (advanced users only)
 * This is what gets saved in localStorage if user manually configures it
 */
export function getDefaultDartsCallerUrl(): string {
  // If saved in localStorage, use that
  const saved = localStorage.getItem('dartscaller_url');
  if (saved) return saved;
  
  // Otherwise, always use localhost:8079 since darts-caller runs on the Pi
  // and the backend proxies the connection
  return 'http://localhost:8079';
}

export default config;