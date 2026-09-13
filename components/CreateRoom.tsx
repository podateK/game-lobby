'use client';

import { useState } from 'react';
import { GameSettings as GameSettingsType } from '@/lib/types';

interface CreateRoomProps {
  onClose: () => void;
  onCreate: (
    name: string,
    settings: GameSettingsType,
    maxPlayers: number,
    isPrivate: boolean,
    password?: string
  ) => void;
}

export default function CreateRoom({ onClose, onCreate }: CreateRoomProps) {
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<GameSettingsType>({
    gameMode: 'classic',
    mapSelection: 'default',
    timeLimit: 300,
    scoreLimit: 10,
    allowSpectators: true,
    isRanked: false,
    customRules: {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), settings, maxPlayers, isPrivate, isPrivate ? password : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Create Room</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Room Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="My Awesome Room"
                maxLength={30}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Game Mode</label>
              <select
                value={settings.gameMode}
                onChange={(e) =>
                  setSettings({ ...settings, gameMode: e.target.value as GameSettingsType['gameMode'] })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="classic">Classic</option>
                <option value="ranked">Ranked</option>
                <option value="tournament">Tournament</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Map</label>
              <select
                value={settings.mapSelection}
                onChange={(e) => setSettings({ ...settings, mapSelection: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="default">Default</option>
                <option value="arena">Arena</option>
                <option value="forest">Forest</option>
                <option value="desert">Desert</option>
                <option value="ice">Ice</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Max Players</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[2, 4, 6, 8, 10, 12, 16].map((n) => (
                    <option key={n} value={n}>
                      {n} Players
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Score Limit</label>
                <select
                  value={settings.scoreLimit}
                  onChange={(e) => setSettings({ ...settings, scoreLimit: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[5, 10, 15, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} Points
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowSpectators}
                  onChange={(e) => setSettings({ ...settings, allowSpectators: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-300">Allow Spectators</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isRanked}
                  onChange={(e) => setSettings({ ...settings, isRanked: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-300">Ranked</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-300">Private Room</span>
            </div>

            {isPrivate && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter password"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 rounded-lg font-medium transition-colors"
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
