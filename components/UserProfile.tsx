'use client';

import { useState } from 'react';
import { User } from '@/lib/types';

interface UserProfileProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
}

export default function UserProfile({ user, onUpdateUser }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(user.username);

  const rankColors: Record<string, string> = {
    Bronze: 'text-orange-400',
    Silver: 'text-slate-300',
    Gold: 'text-yellow-400',
    Platinum: 'text-cyan-400',
    Diamond: 'text-purple-400',
    Master: 'text-red-400',
  };

  const winRate = user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0;

  const handleSaveUsername = () => {
    if (username.trim().length >= 3) {
      onUpdateUser({ username: username.trim() });
      setEditMode(false);
    }
  };

  const handleAvatarChange = () => {
    const seed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    onUpdateUser({ avatar: newAvatar });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
      >
        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-white/10" />
        <span className="text-sm font-medium hidden sm:block">{user.username}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-72 glass rounded-xl z-50 shadow-xl">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-14 h-14 rounded-full bg-white/10"
                  />
                  <button
                    onClick={handleAvatarChange}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  {editMode ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        maxLength={20}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                      />
                      <button
                        onClick={handleSaveUsername}
                        className="p-1 bg-primary-600 hover:bg-primary-500 rounded"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate">{user.username}</span>
                      <button
                        onClick={() => setEditMode(true)}
                        className="p-0.5 hover:bg-white/10 rounded"
                      >
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className={`text-xs font-medium ${rankColors[user.rank] || 'text-slate-400'}`}>
                    {user.rank}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-400">{user.elo}</div>
                  <div className="text-xs text-slate-400">ELO</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{winRate}%</div>
                  <div className="text-xs text-slate-400">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{user.gamesPlayed}</div>
                  <div className="text-xs text-slate-400">Games</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Wins</span>
                  <span className="text-green-400">{user.wins}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div
                    className="bg-green-400 h-1.5 rounded-full"
                    style={{ width: `${user.gamesPlayed > 0 ? (user.wins / user.gamesPlayed) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Losses</span>
                  <span className="text-red-400">{user.losses}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div
                    className="bg-red-400 h-1.5 rounded-full"
                    style={{ width: `${user.gamesPlayed > 0 ? (user.losses / user.gamesPlayed) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
