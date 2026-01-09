import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import config from '../config';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket
  useEffect(() => {
    if (!token) return;

    const newSocket = io(config.socket.url, {
      auth: { token },
      ...config.socket,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Listen for changes and cursor updates
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_changes', (delta) => {
      if (window.editor) {
        window.editor.updateContents(delta);
      }
    });

    socket.on('user_cursor', ({ position, user, socketId }) => {
      if (window.editor) {
        window.editor.showCursor(socketId, position, user);
      }
    });

    return () => {
      socket.off('receive_changes');
      socket.off('user_cursor');
    };
  }, [socket]);

  const joinRoom = (documentId) => {
    if (socket) socket.emit('join_document', { documentId });
  };

  const leaveRoom = (documentId) => {
    if (socket) socket.emit('leave_document', { documentId });
  };

  const sendEdit = (documentId, delta) => {
    if (socket) socket.emit('send_changes', { documentId, delta });
  };

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, joinRoom, leaveRoom, sendEdit }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
