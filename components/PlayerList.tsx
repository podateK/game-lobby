'use client';

import { Player } from '@/lib/types';

interface PlayerListProps {
  players: Player[];
  currentUserId: string;
  isHost: boolean;
  onKick: (playerId: string) => void;
  onToggleReady: (ready: boolean) => void;
}

export default function PlayerList({
  players,
  currentUserId,
  isHost,
  onKick,
  onToggleReady,
}: PlayerListProps) {
  return (
    <div className="glass rounded-2xl">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-bold">Players ({players.length})</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {players.filter((p) => p.isReady).length} ready
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {players.map((player) => (
          <div
            key={player.user.id}
            className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={player.user.avatar}
                  alt={player.user.username}
                  className="w-10 h-10 rounded-full bg-white/10"
                />
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-200 ${
                    player.user.status === 'online'
                      ? 'bg-green-400'
                      : player.user.status === 'in-game'
                      ? 'bg-yellow-400'
                      : 'bg-slate-500'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{player.user.username}</span>
                  {player.user.id === currentUserId && (
                    <span className="text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                  {player.user.id === player.user.id && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                      Host
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>ELO {player.user.elo}</span>
                  <span>·</span>
                  <span>{player.user.wins}W {player.user.losses}L</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  player.isReady
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {player.isReady ? 'Ready' : 'Not Ready'}
              </div>
              {isHost && player.user.id !== currentUserId && (
                <button
                  onClick={() => onKick(player.user.id)}
                  className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                  title="Kick player"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="px-4 py-3 flex items-center gap-3 text-slate-600"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <span className="text-sm">Waiting for player...</span>
          </div>
        ))}
      </div>
    </div>
  );
}
