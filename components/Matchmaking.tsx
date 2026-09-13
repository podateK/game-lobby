'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { User, MatchmakingTicket } from '@/lib/types';

interface MatchmakingProps {
  user: User;
  onComplete: () => void;
}

export default function Matchmaking({ user, onComplete }: MatchmakingProps) {
  const [queueTime, setQueueTime] = useState(0);
  const [status, setStatus] = useState<'idle' | 'queuing' | 'matched' | 'error'>('idle');
  const [estimatedWait, setEstimatedWait] = useState(15);
  const [gameMode, setGameMode] = useState('classic');
  const [region, setRegion] = useState('na');

  useEffect(() => {
    const socket = getSocket(user.id, user.username);

    socket.on('matchmaking:queued', (ticket: MatchmakingTicket) => {
      setStatus('queuing');
    });

    socket.on('matchmaking:matched', () => {
      setStatus('matched');
      setTimeout(onComplete, 1500);
    });

    socket.on('matchmaking:cancelled', () => {
      setStatus('idle');
    });

    socket.on('matchmaking:error', (err: string) => {
      setStatus('error');
    });

    return () => {
      socket.off('matchmaking:queued');
      socket.off('matchmaking:matched');
      socket.off('matchmaking:cancelled');
      socket.off('matchmaking:error');
    };
  }, [user.id, user.username, onComplete]);

  useEffect(() => {
    if (status !== 'queuing') return;
    const interval = setInterval(() => {
      setQueueTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== 'queuing') return;
    const estimate = 15 + Math.floor(user.elo / 200);
    setEstimatedWait(estimate);
  }, [status, user.elo]);

  const handleJoinQueue = useCallback(() => {
    const socket = getSocket(user.id, user.username);
    socket.emit('matchmaking:join-queue', gameMode, region);
    setQueueTime(0);
    setStatus('queuing');
  }, [user.id, user.username, gameMode, region]);

  const handleLeaveQueue = useCallback(() => {
    const socket = getSocket(user.id, user.username);
    socket.emit('matchmaking:leave-queue');
    setStatus('idle');
    setQueueTime(0);
  }, [user.id, user.username]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Quick Match</h2>
            <button
              onClick={() => {
                if (status === 'queuing') handleLeaveQueue();
                onComplete();
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {status === 'idle' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚡</div>
                <p className="text-slate-300">Find a match based on your skill level</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Game Mode</label>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="classic">Classic</option>
                  <option value="ranked">Ranked</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="na">North America</option>
                  <option value="eu">Europe</option>
                  <option value="asia">Asia</option>
                  <option value="sa">South America</option>
                  <option value="oc">Oceania</option>
                </select>
              </div>

              <div className="glass rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Your ELO</span>
                  <span className="font-bold text-primary-400">{user.elo}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-400">Rank</span>
                  <span className="font-bold">{user.rank}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-400">Record</span>
                  <span className="font-bold">
                    {user.wins}W - {user.losses}L
                  </span>
                </div>
              </div>

              <button
                onClick={handleJoinQueue}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 rounded-lg font-medium transition-all glow-primary mt-4"
              >
                Find Match
              </button>
            </div>
          )}

          {status === 'queuing' && (
            <div className="text-center space-y-6">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{formatTime(queueTime)}</span>
                </div>
              </div>

              <div>
                <p className="text-lg font-medium">Searching for opponents...</p>
                <p className="text-sm text-slate-400 mt-1">
                  Estimated wait: ~{estimatedWait}s
                </p>
              </div>

              <div className="glass rounded-xl p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-slate-400">ELO {user.elo}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-white/5 px-2 py-1 rounded">{gameMode}</span>
                  <span className="text-xs bg-white/5 px-2 py-1 rounded">{region.toUpperCase()}</span>
                </div>
              </div>

              <button
                onClick={handleLeaveQueue}
                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          {status === 'matched' && (
            <div className="text-center space-y-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <div>
                <h3 className="text-xl font-bold text-green-400">Match Found!</h3>
                <p className="text-slate-400 mt-1">Joining game...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">❌</div>
              <div>
                <h3 className="text-lg font-bold text-red-400">Matchmaking Error</h3>
                <p className="text-slate-400 mt-1">Please try again</p>
              </div>
              <button
                onClick={handleJoinQueue}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
