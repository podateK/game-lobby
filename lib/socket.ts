import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from './types';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export const getSocket = (userId: string, username: string): GameSocket => {
  if (!socket) {
    socket = io('http://localhost:3001', {
      query: { userId, username },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocketId = (): string | null => {
  return socket?.id ?? null;
};
