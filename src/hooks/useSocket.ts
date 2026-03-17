'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
// BLOCKED: Waiting on Backend Agent for server.ts and socket.io setup
// TEMPORARY — this hook will connect to Socket.io once the backend is ready

type SocketEventHandler = (...args: unknown[]) => void;

interface UseSocketReturn {
  isConnected: boolean;
  emit: (event: string, data: unknown) => void;
  on: (event: string, handler: SocketEventHandler) => void;
  off: (event: string, handler: SocketEventHandler) => void;
}

export function useSocket(_namespace?: string): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<Map<string, Set<SocketEventHandler>>>(new Map());

  useEffect(() => {
    // TEMPORARY: Simulate connection
    const timer = setTimeout(() => setIsConnected(true), 500);
    return () => {
      clearTimeout(timer);
      setIsConnected(false);
    };
  }, []);

  const emit = useCallback((_event: string, _data: unknown): void => {
    // BLOCKED: Will use socket.emit() when socket.io-client is wired
    console.log('[Socket Mock] emit:', _event, _data);
  }, []);

  const on = useCallback((event: string, handler: SocketEventHandler): void => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);
  }, []);

  const off = useCallback((event: string, handler: SocketEventHandler): void => {
    handlersRef.current.get(event)?.delete(handler);
  }, []);

  return { isConnected, emit, on, off };
}
