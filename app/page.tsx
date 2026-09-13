'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Lobby from '@/components/Lobby';
import UserProfile from '@/components/UserProfile';
import { User } from '@/lib/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const initUser = useCallback(() => {
    const stored = localStorage.getItem('game-lobby-user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      const newUser: User = {
        id: uuidv4(),
        username: `Player${Math.floor(Math.random() * 9999)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        elo: 1000,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        rank: 'Bronze',
        status: 'online',
        lastActive: new Date(),
      };
      localStorage.setItem('game-lobby-user', JSON.stringify(newUser));
      setUser(newUser);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    initUser();
  }, [initUser]);

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('game-lobby-user', JSON.stringify(updated));
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                Game Lobby
              </h1>
            </div>
            <UserProfile user={user} onUpdateUser={updateUser} />
          </div>
        </div>
      </header>
      <Lobby user={user} />
    </main>
  );
}
