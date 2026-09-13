'use client';

import { GameSettings as GameSettingsType } from '@/lib/types';

interface GameSettingsProps {
  settings: GameSettingsType;
  onUpdate: (settings: GameSettingsType) => void;
  isHost: boolean;
}

export default function GameSettings({ settings, onUpdate, isHost }: GameSettingsProps) {
  const handleChange = (key: keyof GameSettingsType, value: string | number | boolean) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="glass rounded-2xl">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold">Game Settings</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Game Mode</label>
            <select
              value={settings.gameMode}
              onChange={(e) => handleChange('gameMode', e.target.value)}
              disabled={!isHost}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="classic">Classic</option>
              <option value="ranked">Ranked</option>
              <option value="tournament">Tournament</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Map</label>
            <select
              value={settings.mapSelection}
              onChange={(e) => handleChange('mapSelection', e.target.value)}
              disabled={!isHost}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="default">Default</option>
              <option value="arena">Arena</option>
              <option value="forest">Forest</option>
              <option value="desert">Desert</option>
              <option value="ice">Ice</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Score Limit</label>
            <select
              value={settings.scoreLimit}
              onChange={(e) => handleChange('scoreLimit', Number(e.target.value))}
              disabled={!isHost}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[5, 10, 15, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Time Limit (s)</label>
            <select
              value={settings.timeLimit}
              onChange={(e) => handleChange('timeLimit', Number(e.target.value))}
              disabled={!isHost}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[60, 120, 180, 300, 600, 0].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'No limit' : `${n / 60}m`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowSpectators}
              onChange={(e) => handleChange('allowSpectators', e.target.checked)}
              disabled={!isHost}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
            />
            <span className="text-sm text-slate-300">Spectators</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.isRanked}
              onChange={(e) => handleChange('isRanked', e.target.checked)}
              disabled={!isHost}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
            />
            <span className="text-sm text-slate-300">Ranked</span>
          </label>
        </div>
      </div>
    </div>
  );
}
