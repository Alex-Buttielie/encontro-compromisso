'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useMemo(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return io(apiUrl, {
      transports: ['websocket'],
      autoConnect: false,
      auth: { token: typeof localStorage !== 'undefined' ? localStorage.getItem('profissionalOS_token') : null },
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('profissionalOS_token');
    if (token) {
      socket.connect();
    }
    return () => { socket.disconnect(); };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error('useSocket must be used within SocketProvider');
  return socket;
}
