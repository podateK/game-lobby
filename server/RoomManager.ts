import { v4 as uuidv4 } from 'uuid';
import { Room, Player, User, GameSettings, GameState } from '../lib/types';
import { GameSession } from './GameSession';
import { Server } from 'socket.io';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private sessions: Map<string, GameSession> = new Map();
  private userRooms: Map<string, string> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  createRoom(
    host: User,
    name: string,
    settings: GameSettings,
    maxPlayers: number,
    isPrivate: boolean,
    password: string = '',
    region: string = 'na'
  ): Room {
    const room: Room = {
      id: uuidv4(),
      name,
      hostId: host.id,
      hostUsername: host.username,
      maxPlayers: Math.min(Math.max(maxPlayers, 2), 16),
      currentPlayers: 1,
      players: [
        {
          user: host,
          isReady: false,
          isInGame: false,
          score: 0,
          joinedAt: new Date(),
        },
      ],
      spectators: [],
      gameState: {
        status: 'waiting',
        countdown: 0,
        winner: null,
        startTime: null,
        endTime: null,
      },
      gameSettings: settings,
      isPrivate,
      password,
      createdAt: new Date(),
      region,
    };

    this.rooms.set(room.id, room);
    this.userRooms.set(host.id, room.id);
    this.broadcastRoomList();
    return room;
  }

  joinRoom(roomId: string, user: User, password: string = ''): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.isPrivate && room.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    if (room.currentPlayers >= room.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    if (room.gameState.status !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }

    const existing = room.players.find((p) => p.user.id === user.id);
    if (existing) {
      return { success: false, error: 'Already in room' };
    }

    const player: Player = {
      user,
      isReady: false,
      isInGame: false,
      score: 0,
      joinedAt: new Date(),
    };

    room.players.push(player);
    room.currentPlayers = room.players.length;
    this.userRooms.set(user.id, roomId);

    this.io.to(roomId).emit('room:player-joined', room, player);
    this.io.to(roomId).emit('chat:message', {
      id: uuidv4(),
      userId: 'system',
      username: 'System',
      avatar: '',
      content: `${user.username} joined the room`,
      timestamp: new Date(),
      type: 'system',
    });
    this.broadcastRoomList();

    return { success: true, room };
  }

  leaveRoom(roomId: string, userId: string): { room?: Room; wasHost: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { wasHost: false };

    const wasHost = room.hostId === userId;
    room.players = room.players.filter((p) => p.user.id !== userId);
    room.currentPlayers = room.players.length;
    this.userRooms.delete(userId);

    if (room.players.length === 0) {
      this.closeRoom(roomId);
      return { wasHost };
    }

    if (wasHost) {
      room.hostId = room.players[0].user.id;
      room.hostUsername = room.players[0].user.username;
    }

    this.io.to(roomId).emit('room:player-left', room, { user: { id: userId } } as Player);
    this.io.to(roomId).emit('chat:message', {
      id: uuidv4(),
      userId: 'system',
      username: 'System',
      avatar: '',
      content: `A player left the room`,
      timestamp: new Date(),
      type: 'system',
    });
    this.broadcastRoomList();

    return { room, wasHost };
  }

  closeRoom(roomId: string): void {
    const session = this.sessions.get(roomId);
    if (session) {
      session.cancel();
      this.sessions.delete(roomId);
    }

    const room = this.rooms.get(roomId);
    if (room) {
      room.players.forEach((p) => this.userRooms.delete(p.user.id));
    }

    this.rooms.delete(roomId);
    this.io.emit('room:closed', roomId);
    this.broadcastRoomList();
  }

  setPlayerReady(roomId: string, userId: string, isReady: boolean): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.user.id === userId);
    if (!player) return null;

    player.isReady = isReady;
    this.io.to(roomId).emit('room:state-changed', room);

    if (room.players.length >= 2 && room.players.every((p) => p.isReady)) {
      this.startGameCountdown(roomId);
    }

    return room;
  }

  startGameCountdown(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState.status !== 'waiting') return;

    if (room.players.length < 2) {
      this.io.to(roomId).emit('room:error', 'Need at least 2 players');
      return;
    }

    const session = new GameSession(roomId, room.gameSettings, room.players);
    this.sessions.set(roomId, session);

    session.startCountdown((countdown) => {
      room.gameState.status = 'starting';
      room.gameState.countdown = countdown;
      this.io.to(roomId).emit('room:countdown', roomId, countdown);
      this.io.to(roomId).emit('room:state-changed', room);

      if (countdown <= 0) {
        room.gameState.status = 'playing';
        room.gameState.startTime = new Date();
        room.players.forEach((p) => {
          p.isInGame = true;
        });
        this.io.to(roomId).emit('room:game-started', room);
        this.broadcastRoomList();
      }
    });
  }

  finishGame(roomId: string, winnerId: string | null): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const session = this.sessions.get(roomId);
    if (session) {
      session.endGame(winnerId);
    }

    room.gameState.status = 'finished';
    room.gameState.winner = winnerId;
    room.gameState.endTime = new Date();
    room.players.forEach((p) => {
      p.isReady = false;
      p.isInGame = false;
    });

    this.io.to(roomId).emit('room:game-finished', room, winnerId ?? 'draw');
    this.broadcastRoomList();

    return room;
  }

  updateSettings(roomId: string, settings: GameSettings): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.gameSettings = settings;
    this.io.to(roomId).emit('room:update', room);
    this.broadcastRoomList();
    return room;
  }

  kickPlayer(roomId: string, targetId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const idx = room.players.findIndex((p) => p.user.id === targetId);
    if (idx === -1) return null;

    room.players.splice(idx, 1);
    room.currentPlayers = room.players.length;
    this.userRooms.delete(targetId);

    this.io.to(roomId).emit('room:player-left', room, { user: { id: targetId } } as Player);
    this.broadcastRoomList();
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomList(): Room[] {
    return Array.from(this.rooms.values()).filter((r) => !r.isPrivate);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getUserRoom(userId: string): string | undefined {
    return this.userRooms.get(userId);
  }

  private broadcastRoomList(): void {
    this.io.emit('room:list', this.getRoomList());
  }
}
