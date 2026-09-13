'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import CreateRoom from './CreateRoom';
import RoomCard from './RoomCard';
import Matchmaking from './Matchmaking';
import UserProfile from './UserProfile';
import { Room, User, GameSettings, RoomFilters } from '@/lib/types';

interface LobbyProps {
  user: User;
}

export default function Lobby({ user }: LobbyProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-rooms'>('browse');
  const [filters, setFilters] = useState<RoomFilters>({
    status: [],
    gameMode: [],
    region: [],
    maxPlayers: null,
    hasPassword: false,
    searchQuery: '',
  });

  useEffect(() => {
    const socket = getSocket(user.id, user.username);

    socket.on('room:list', (roomList: Room[]) => {
      setRooms(roomList);
    });

    socket.on('room:update', (room: Room) => {
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
    });

    socket.on('room:created', (room: Room) => {
      setRooms((prev) => [...prev, room]);
    });

    socket.on('room:closed', (roomId: string) => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    });

    return () => {
      socket.off('room:list');
      socket.off('room:update');
      socket.off('room:created');
      socket.off('room:closed');
    };
  }, [user.id, user.username]);

  useEffect(() => {
    let result = [...rooms];

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.hostUsername.toLowerCase().includes(q)
      );
    }

    if (filters.status.length > 0) {
      result = result.filter((r) => filters.status.includes(r.gameState.status));
    }

    if (filters.gameMode.length > 0) {
      result = result.filter((r) => filters.gameMode.includes(r.gameSettings.gameMode));
    }

    if (filters.region.length > 0) {
      result = result.filter((r) => filters.region.includes(r.region));
    }

    if (filters.maxPlayers !== null) {
      result = result.filter((r) => r.maxPlayers <= filters.maxPlayers!);
    }

    if (filters.hasPassword) {
      result = result.filter((r) => r.isPrivate);
    }

    if (activeTab === 'my-rooms') {
      result = result.filter((r) => r.players.some((p) => p.user.id === user.id));
    }

    setFilteredRooms(result);
  }, [rooms, filters, activeTab, user.id]);

  const handleCreateRoom = useCallback(
    (name: string, settings: GameSettings, maxPlayers: number, isPrivate: boolean, password?: string) => {
      const socket = getSocket(user.id, user.username);
      socket.emit('room:create', settings, name, maxPlayers, isPrivate, password);
      setShowCreateModal(false);
    },
    [user.id, user.username]
  );

  const handleMatchComplete = useCallback(() => {
    setShowMatchmaking(false);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Game Lobby</h2>
          <p className="text-slate-400">{rooms.length} rooms available</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowMatchmaking(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 rounded-lg font-medium transition-all glow-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Match
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Room
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl mb-6">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'browse'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Browse Rooms
          </button>
          <button
            onClick={() => setActiveTab('my-rooms')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'my-rooms'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Rooms
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <RoomCard key={room.id} room={room} currentUserId={user.id} />
        ))}
        {filteredRooms.length === 0 && (
          <div className="col-span-full text-center py-16 glass rounded-2xl">
            <div className="text-slate-500 text-4xl mb-4">🎮</div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No rooms found</h3>
            <p className="text-slate-500">Try adjusting your filters or create a new room</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateRoom
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {showMatchmaking && (
        <Matchmaking user={user} onComplete={handleMatchComplete} />
      )}
    </div>
  );
}
