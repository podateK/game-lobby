export interface User {
  id: string;
  username: string;
  avatar: string;
  elo: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
  status: 'online' | 'in-game' | 'in-lobby' | 'offline';
  lastActive: Date;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  hostUsername: string;
  maxPlayers: number;
  currentPlayers: number;
  players: Player[];
  spectators: User[];
  gameState: GameState;
  gameSettings: GameSettings;
  isPrivate: boolean;
  password: string;
  createdAt: Date;
  region: string;
}

export interface Player {
  user: User;
  isReady: boolean;
  isInGame: boolean;
  score: number;
  joinedAt: Date;
}

export interface GameState {
  status: 'waiting' | 'starting' | 'playing' | 'paused' | 'finished' | 'cancelled';
  countdown: number;
  winner: string | null;
  startTime: Date | null;
  endTime: Date | null;
}

export interface GameSettings {
  gameMode: 'classic' | 'ranked' | 'custom' | 'tournament';
  mapSelection: string;
  timeLimit: number;
  scoreLimit: number;
  allowSpectators: boolean;
  isRanked: boolean;
  customRules: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system' | 'emoji';
}

export interface MatchmakingTicket {
  userId: string;
  elo: number;
  gameMode: string;
  region: string;
  queueTime: number;
  status: 'queuing' | 'matched' | 'cancelled';
}

export interface RoomFilters {
  status: string[];
  gameMode: string[];
  region: string[];
  maxPlayers: number | null;
  hasPassword: boolean;
  searchQuery: string;
}

export interface ServerToClientEvents {
  'room:list': (rooms: Room[]) => void;
  'room:update': (room: Room) => void;
  'room:created': (room: Room) => void;
  'room:closed': (roomId: string) => void;
  'room:player-joined': (room: Room, player: Player) => void;
  'room:player-left': (room: Room, player: Player) => void;
  'room:state-changed': (room: Room) => void;
  'room:countdown': (roomId: string, countdown: number) => void;
  'room:game-started': (room: Room) => void;
  'room:game-finished': (room: Room, winner: string) => void;
  'room:error': (error: string) => void;
  'chat:message': (message: ChatMessage) => void;
  'chat:history': (messages: ChatMessage[]) => void;
  'matchmaking:queued': (ticket: MatchmakingTicket) => void;
  'matchmaking:matched': (room: Room) => void;
  'matchmaking:cancelled': () => void;
  'matchmaking:error': (error: string) => void;
  'user:profile': (user: User) => void;
  'user:stats-update': (stats: Partial<User>) => void;
  'error': (error: string) => void;
}

export interface ClientToServerEvents {
  'room:create': (settings: GameSettings, name: string, maxPlayers: number, isPrivate: boolean, password?: string) => void;
  'room:join': (roomId: string, password?: string) => void;
  'room:leave': (roomId: string) => void;
  'room:set-ready': (roomId: string, isReady: boolean) => void;
  'room:start-game': (roomId: string) => void;
  'room:update-settings': (roomId: string, settings: GameSettings) => void;
  'room:kick-player': (roomId: string, playerId: string) => void;
  'room:chat': (roomId: string, content: string) => void;
  'room:filter': (filters: RoomFilters) => void;
  'matchmaking:join-queue': (gameMode: string, region: string) => void;
  'matchmaking:leave-queue': () => void;
  'user:get-profile': (userId: string) => void;
  'user:update-avatar': (avatar: string) => void;
}
