'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { getSocket, disconnectSocket } from '@/lib/socket';
import Chat from '@/components/Chat';
import PlayerList from '@/components/PlayerList';
import GameSettings from '@/components/GameSettings';
import { Room, User, Player, GameSettings as GameSettingsType, ChatMessage } from '@/lib/types';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('game-lobby-user');
    if (!stored) {
      router.push('/');
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);

    const socket = getSocket(u.id, u.username);

    socket.emit('room:join', roomId);

    socket.on('room:update', (r: Room) => {
      setRoom(r);
    });

    socket.on('room:player-joined', (r: Room) => {
      setRoom(r);
    });

    socket.on('room:player-left', (r: Room) => {
      setRoom(r);
    });

    socket.on('room:state-changed', (r: Room) => {
      setRoom(r);
    });

    socket.on('room:countdown', (id: string, c: number) => {
      if (id === roomId) {
        setCountdown(c > 0 ? c : null);
      }
    });

    socket.on('room:game-started', (r: Room) => {
      setRoom(r);
      setCountdown(null);
    });

    socket.on('room:game-finished', (r: Room) => {
      setRoom(r);
    });

    socket.on('room:closed', (id: string) => {
      if (id === roomId) {
        router.push('/');
      }
    });

    socket.on('room:error', (err: string) => {
      setError(err);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat:history', (hist: ChatMessage[]) => {
      setMessages(hist);
    });

    return () => {
      socket.off('room:update');
      socket.off('room:player-joined');
      socket.off('room:player-left');
      socket.off('room:state-changed');
      socket.off('room:countdown');
      socket.off('room:game-started');
      socket.off('room:game-finished');
      socket.off('room:closed');
      socket.off('room:error');
      socket.off('chat:message');
      socket.off('chat:history');
    };
  }, [roomId, router]);

  const isHost = useMemo(() => {
    if (!room || !user) return false;
    return room.hostId === user.id;
  }, [room, user]);

  const currentPlayer = useMemo(() => {
    if (!room || !user) return null;
    return room.players.find((p) => p.user.id === user.id) ?? null;
  }, [room, user]);

  const handleSetReady = useCallback(
    (ready: boolean) => {
      const socket = getSocket(user!.id, user!.username);
      socket.emit('room:set-ready', roomId, ready);
    },
    [user, roomId]
  );

  const handleStartGame = useCallback(() => {
    const socket = getSocket(user!.id, user!.username);
    socket.emit('room:start-game', roomId);
  }, [user, roomId]);

  const handleUpdateSettings = useCallback(
    (settings: GameSettingsType) => {
      const socket = getSocket(user!.id, user!.username);
      socket.emit('room:update-settings', roomId, settings);
    },
    [user, roomId]
  );

  const handleKickPlayer = useCallback(
    (playerId: string) => {
      const socket = getSocket(user!.id, user!.username);
      socket.emit('room:kick-player', roomId, playerId);
    },
    [user, roomId]
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      const socket = getSocket(user!.id, user!.username);
      socket.emit('room:chat', roomId, content);
    },
    [user, roomId]
  );

  const handleLeave = useCallback(() => {
    const socket = getSocket(user!.id, user!.username);
    socket.emit('room:leave', roomId);
    disconnectSocket();
    router.push('/');
  }, [user, roomId, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <div className="text-red-400 text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-slate-400">Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-dark-300">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLeave}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold">{room.name}</h1>
                <p className="text-xs text-slate-400">
                  {room.currentPlayers}/{room.maxPlayers} players
                  {room.isPrivate && ' · Private'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {countdown !== null && (
                <div className="text-2xl font-bold text-primary-400 animate-pulse">
                  {countdown}
                </div>
              )}
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  room.gameState.status === 'waiting'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : room.gameState.status === 'playing'
                    ? 'bg-green-500/20 text-green-400'
                    : room.gameState.status === 'finished'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {room.gameState.status.charAt(0).toUpperCase() + room.gameState.status.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PlayerList
              players={room.players}
              currentUserId={user.id}
              isHost={isHost}
              onKick={handleKickPlayer}
              onToggleReady={handleSetReady}
            />
            {isHost && room.gameState.status === 'waiting' && (
              <GameSettings settings={room.gameSettings} onUpdate={handleUpdateSettings} isHost={isHost} />
            )}
            {!isHost && (
              <GameSettings settings={room.gameSettings} onUpdate={handleUpdateSettings} isHost={false} />
            )}
            {room.gameState.status === 'waiting' && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      {currentPlayer?.isReady ? 'You are ready' : 'You are not ready'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSetReady(!currentPlayer?.isReady)}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                        currentPlayer?.isReady
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {currentPlayer?.isReady ? 'Not Ready' : 'Ready Up'}
                    </button>
                    {isHost && (
                      <button
                        onClick={handleStartGame}
                        disabled={!room.players.every((p) => p.isReady) || room.players.length < 2}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                      >
                        Start Game
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <Chat messages={messages} onSend={handleSendMessage} currentUserId={user.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
