import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setOnlineUsers(new Set());
      return undefined;
    }

    const token = localStorage.getItem('rivvo_token');
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    // who is online right now (sent once when we connect); user:online/offline then keep it current
    socket.on('presence:init', ({ userIds }) => setOnlineUsers(new Set((userIds || []).map(String))));
    socket.on('user:online', ({ userId }) =>
      setOnlineUsers((prev) => new Set(prev).add(String(userId)))
    );
    socket.on('user:offline', ({ userId }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      })
    );

    socketRef.current = socket;
    return () => socket.disconnect();
  }, [user]);

  // live status when connected; otherwise fall back to whatever the server last stored
  const isOnline = useCallback(
    (id, fallback = false) => (connected ? onlineUsers.has(String(id)) : Boolean(fallback)),
    [connected, onlineUsers]
  );

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);

export default SocketContext;
