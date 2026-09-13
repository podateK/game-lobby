import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from './RoomManager';
import { Matchmaker } from './Matchmaker';
import {
  Room,
  User,
  Player,
  ChatMessage,
  GameSettings,
  RoomFilters,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../lib/types';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT ?? '3001', 10);
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const httpServer = createServer((req, res) => {
  nextHandler(req, res);
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 10000,
  pingInterval: 5000,
  transports: ['websocket', 'polling'],
});

const roomManager = new RoomManager(io);
const matchmaker = new Matchmaker();

const connectedUsers = new Map<string, { socketId: string; user: User }>();

io.on('connection', (socket) => {
  const { userId, username } = socket.handshake.query as { userId: string; username: string };

  if (!userId || !username) {
    socket.disconnect(true);
    return;
  }

  const user: User = {
    id: userId,
    username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    elo: 1000,
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    rank: 'Bronze',
    status: 'online',
    lastActive: new Date(),
  };

  connectedUsers.set(userId, { socketId: socket.id, user });
  console.log(`[+] ${username} connected (${socket.id})`);

  socket.emit('room:list', roomManager.getRoomList());

  socket.on('room:create', (settings: GameSettings, name: string, maxPlayers: number, isPrivate: boolean, password?: string) => {
    const existingRoom = roomManager.getUserRoom(userId);
    if (existingRoom) {
      socket.emit('room:error', 'You are already in a room');
      return;
    }

    const room = roomManager.createRoom(user, name, settings, maxPlayers, isPrivate, password);
    socket.join(room.id);
    socket.emit('room:created', room);

    const chatMsg: ChatMessage = {
      id: uuidv4(),
      userId: 'system',
      username: 'System',
      avatar: '',
      content: `${username} created the room`,
      timestamp: new Date(),
      type: 'system',
    };
    io.to(room.id).emit('chat:message', chatMsg);
  });

  socket.on('room:join', (roomId: string, password?: string) => {
    const result = roomManager.joinRoom(roomId, user, password);
    if (result.success && result.room) {
      socket.join(roomId);
      socket.emit('room:update', result.room);

      const otherPlayers = result.room.players.filter((p) => p.user.id !== userId);
      const chatMsg: ChatMessage = {
        id: uuidv4(),
        userId: 'system',
        username: 'System',
        avatar: '',
        content: `${username} joined the room`,
        timestamp: new Date(),
        type: 'system',
      };
      io.to(roomId).emit('chat:message', chatMsg);
    } else {
      socket.emit('room:error', result.error ?? 'Failed to join room');
    }
  });

  socket.on('room:leave', (roomId: string) => {
    socket.leave(roomId);
    roomManager.leaveRoom(roomId, userId);
  });

  socket.on('room:set-ready', (roomId: string, isReady: boolean) => {
    const room = roomManager.setPlayerReady(roomId, userId, isReady);
    if (room) {
      io.to(roomId).emit('room:state-changed', room);
    }
  });

  socket.on('room:start-game', (roomId: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== userId) {
      socket.emit('room:error', 'Only the host can start the game');
      return;
    }
    roomManager.startGameCountdown(roomId);
  });

  socket.on('room:update-settings', (roomId: string, settings: GameSettings) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== userId) {
      socket.emit('room:error', 'Only the host can change settings');
      return;
    }
    roomManager.updateSettings(roomId, settings);
  });

  socket.on('room:kick-player', (roomId: string, targetId: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== userId) {
      socket.emit('room:error', 'Only the host can kick players');
      return;
    }
    const kickedRoom = roomManager.kickPlayer(roomId, targetId);
    if (kickedRoom) {
      const kickedEntry = connectedUsers.get(targetId);
      if (kickedEntry) {
        io.to(kickedEntry.socketId).emit('room:closed', roomId);
      }
    }
  });

  socket.on('room:chat', (roomId: string, content: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    if (!room.players.some((p) => p.user.id === userId)) return;

    const chatMsg: ChatMessage = {
      id: uuidv4(),
      userId,
      username,
      avatar: user.avatar,
      content: content.substring(0, 200),
      timestamp: new Date(),
      type: 'message',
    };
    io.to(roomId).emit('chat:message', chatMsg);
  });

  socket.on('room:filter', (_filters: RoomFilters) => {
    socket.emit('room:list', roomManager.getRoomList());
  });

  socket.on('matchmaking:join-queue', (gameMode: string, region: string) => {
    const existingRoom = roomManager.getUserRoom(userId);
    if (existingRoom) {
      socket.emit('matchmaking:error', 'You are already in a room');
      return;
    }

    const ticket = {
      userId,
      elo: user.elo,
      gameMode,
      region,
      queueTime: 0,
      status: 'queuing' as const,
    };

    matchmaker.addToQueue(ticket);
    socket.emit('matchmaking:queued', ticket);
  });

  socket.on('matchmaking:leave-queue', () => {
    matchmaker.removeFromQueue(userId);
    socket.emit('matchmaking:cancelled');
  });

  socket.on('user:get-profile', (targetId: string) => {
    const entry = connectedUsers.get(targetId);
    if (entry) {
      socket.emit('user:profile', entry.user);
    }
  });

  socket.on('user:update-avatar', (avatar: string) => {
    user.avatar = avatar;
    const entry = connectedUsers.get(userId);
    if (entry) entry.user = avatar as any;
  });

  socket.on('disconnect', (reason) => {
    console.log(`[-] ${username} disconnected (${reason})`);
    connectedUsers.delete(userId);

    const currentRoom = roomManager.getUserRoom(userId);
    if (currentRoom) {
      roomManager.leaveRoom(currentRoom, userId);
    }

    matchmaker.removeFromQueue(userId);
  });
});

nextApp.prepare().then(() => {
  httpServer.listen(port, () => {
    console.log(`> Server running on http://localhost:${port}`);
    console.log(`> Socket.io ready`);
  });
});
