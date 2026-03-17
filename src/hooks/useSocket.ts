'use client';

import { useCallback, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

type SocketEventHandler = (...args: unknown[]) => void;

interface UseSocketReturn {
  isConnected: boolean;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: SocketEventHandler) => void;
  off: (event: string, handler: SocketEventHandler) => void;
}

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }

  return socketInstance;
}

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState<boolean>(() => getSocket().connected);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = (): void => {
      setIsConnected(true);
    };

    const handleDisconnect = (): void => {
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown): void => {
    getSocket().emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: SocketEventHandler): void => {
    getSocket().on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: SocketEventHandler): void => {
    getSocket().off(event, handler);
  }, []);

  return {
    isConnected,
    emit,
    on,
    off,
  };
}
