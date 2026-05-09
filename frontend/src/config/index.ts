// Environment configuration for API endpoints

export const config = {
  // API base URL - defaults to localhost for development
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // WebSocket URL - defaults to localhost for development
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  
  // Enable backend integration (set to false to use local-only mode)
  useBackend: import.meta.env.VITE_USE_BACKEND !== 'false',
  
  // Reconnection settings
  wsReconnectInterval: 3000,
  wsMaxReconnectAttempts: 5,
  
  // Request timeout
  requestTimeout: 30000,
};

export type Config = typeof config;
