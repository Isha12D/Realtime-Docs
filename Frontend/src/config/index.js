// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const config = {
  api: {
    baseURL: API_BASE_URL,
    timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
  },
  socket: {
    url: SOCKET_URL,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  },
};

export default config;
