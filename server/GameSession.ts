import { v4 as uuidv4 } from 'uuid';
import { GameState, GameSettings, Player } from '../lib/types';

export class GameSession {
  public id: string;
  public roomId: string;
  public settings: GameSettings;
  public state: GameState;
  public players: Map<string, Player>;
  public scores: Map<string, number>;
  public tickInterval: NodeJS.Timeout | null;
  public readonly TICK_RATE = 1000;

  constructor(roomId: string, settings: GameSettings, players: Player[]) {
    this.id = uuidv4();
    this.roomId = roomId;
    this.settings = settings;
    this.state = {
      status: 'waiting',
      countdown: 0,
      winner: null,
      startTime: null,
      endTime: null,
    };
    this.players = new Map();
    this.scores = new Map();
    this.tickInterval = null;

    players.forEach((p) => {
      this.players.set(p.user.id, p);
      this.scores.set(p.user.id, 0);
    });
  }

  startCountdown(callback: (countdown: number) => void): void {
    this.state.status = 'starting';
    this.state.countdown = 5;

    this.tickInterval = setInterval(() => {
      this.state.countdown--;
      callback(this.state.countdown);

      if (this.state.countdown <= 0) {
        this.startGame();
      }
    }, this.TICK_RATE);
  }

  private startGame(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.state.status = 'playing';
    this.state.startTime = new Date();
  }

  addScore(playerId: string, points: number): boolean {
    const current = this.scores.get(playerId) ?? 0;
    this.scores.set(playerId, current + points);

    if (this.settings.scoreLimit > 0 && current + points >= this.settings.scoreLimit) {
      this.endGame(playerId);
      return true;
    }
    return false;
  }

  endGame(winnerId: string | null): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.state.status = 'finished';
    this.state.winner = winnerId;
    this.state.endTime = new Date();
  }

  cancel(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.state.status = 'cancelled';
    this.state.endTime = new Date();
  }

  pause(): void {
    this.state.status = 'paused';
  }

  resume(): void {
    this.state.status = 'playing';
  }

  getPlayerScore(playerId: string): number {
    return this.scores.get(playerId) ?? 0;
  }

  getResults(): { playerId: string; score: number; username: string }[] {
    return Array.from(this.players.entries()).map(([id, player]) => ({
      playerId: id,
      score: this.scores.get(id) ?? 0,
      username: player.user.username,
    })).sort((a, b) => b.score - a.score);
  }

  getDuration(): number {
    if (!this.state.startTime) return 0;
    const end = this.state.endTime ?? new Date();
    return Math.floor((end.getTime() - this.state.startTime.getTime()) / 1000);
  }
}
