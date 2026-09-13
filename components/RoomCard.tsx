'use client';

import { useRouter } from 'next/navigation';
import { Room } from '@/lib/types';

interface RoomCardProps {
  room: Room;
  currentUserId: string;
}

export default function RoomCard({ room, currentUserId }: RoomCardProps) {
  const router = useRouter();
  const isInRoom = room.players.some((p) => p.user.id === currentUserId);
  const isFull = room.currentPlayers >= room.maxPlayers;

  const handleJoin = () => {
    if (isFull && !isInRoom) return;
    router.push(`/room/${room.id}`);
  };

  const statusColors: Record<string, string> = {
    waiting: 'bg-yellow-500/20 text-yellow-400',
    starting: 'bg-orange-500/20 text-orange-400',
    playing: 'bg-green-500/20 text-green-400',
    finished: 'bg-blue-500/20 text-blue-400',
  };

  const modeIcons: Record<string, string> = {
    classic: '🎯',
    ranked: '🏆',
    tournament: '⚔',
    custom: '🎲',
  };

  return (
    <div
      onClick={handleJoin}
      className={`glass rounded-xl p-4 cursor-pointer transition-all hover:bg-white/10 hover:scale-[1.02] ${
        isInRoom ? 'ring-2 ring-primary-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{modeIcons[room.gameSettings.gameMode] || '🎮'}</span>
            <h3 className="font-bold text-sm truncate">{room.name}</h3>
            {room.isPrivate && (
              <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <p className="text-xs text-slate-400">by {room.hostUsername}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[room.gameState.status]}`}>
          {room.gameState.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Players</span>
          <span className="font-medium">
            {room.currentPlayers}/{room.maxPlayers}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <div
            className="bg-primary-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(room.currentPlayers / room.maxPlayers) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {room.players.slice(0, 6).map((player) => (
            <img
              key={player.user.id}
              src={player.user.avatar}
              alt={player.user.username}
              className="w-6 h-6 rounded-full bg-white/10"
            />
          ))}
          {room.players.length > 6 && (
            <span className="text-xs text-slate-400">+{room.players.length - 6}</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{room.gameSettings.gameMode}</span>
          <span>·</span>
          <span>{room.gameSettings.mapSelection}</span>
          <span>·</span>
          <span>{room.region}</span>
        </div>
      </div>

      <div className="mt-3">
        <button
          disabled={isFull && !isInRoom}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
            isInRoom
              ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
              : isFull
              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {isInRoom ? 'Rejoin' : isFull ? 'Full' : 'Join'}
        </button>
      </div>
    </div>
  );
}
