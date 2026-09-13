import { MatchmakingTicket } from '../lib/types';

interface QueueEntry {
  ticket: MatchmakingTicket;
  joinedAt: number;
}

export class Matchmaker {
  private queue: QueueEntry[] = [];
  private matchInterval: NodeJS.Timeout | null = null;
  private readonly MATCH_INTERVAL = 1000;
  private readonly ELO_SPREAD_BASE = 50;
  private readonly ELO_SPREAD_GROWTH = 5;
  private readonly MAX_QUEUE_TIME = 120;

  constructor() {
    this.startMatching();
  }

  private startMatching(): void {
    this.matchInterval = setInterval(() => {
      this.processQueue();
    }, this.MATCH_INTERVAL);
  }

  stop(): void {
    if (this.matchInterval) {
      clearInterval(this.matchInterval);
      this.matchInterval = null;
    }
  }

  addToQueue(ticket: MatchmakingTicket): void {
    const existing = this.queue.find((e) => e.ticket.userId === ticket.userId);
    if (!existing) {
      this.queue.push({ ticket, joinedAt: Date.now() });
    }
  }

  removeFromQueue(userId: string): void {
    this.queue = this.queue.filter((e) => e.ticket.userId !== userId);
  }

  getQueueEntry(userId: string): QueueEntry | undefined {
    return this.queue.find((e) => e.ticket.userId === userId);
  }

  private processQueue(): { p1: string; p2: string; gameMode: string; region: string }[] {
    const matches: { p1: string; p2: string; gameMode: string; region: string }[] = [];

    const now = Date.now();
    this.queue = this.queue.filter((entry) => {
      const elapsed = (now - entry.joinedAt) / 1000;
      return elapsed < this.MAX_QUEUE_TIME && entry.ticket.status === 'queuing';
    });

    const grouped = new Map<string, QueueEntry[]>();
    for (const entry of this.queue) {
      const key = `${entry.ticket.gameMode}-${entry.ticket.region}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    }

    for (const [, entries] of grouped) {
      entries.sort((a, b) => a.ticket.elo - b.ticket.elo);

      const matched = new Set<number>();
      for (let i = 0; i < entries.length; i++) {
        if (matched.has(i)) continue;
        for (let j = i + 1; j < entries.length; j++) {
          if (matched.has(j)) continue;

          const e1 = entries[i];
          const e2 = entries[j];
          const eloDiff = Math.abs(e1.ticket.elo - e2.ticket.elo);
          const queueTime = Math.max(
            (now - e1.joinedAt) / 1000,
            (now - e2.joinedAt) / 1000
          );
          const spread = this.ELO_SPREAD_BASE + queueTime * this.ELO_SPREAD_GROWTH;

          if (eloDiff <= spread) {
            matches.push({
              p1: e1.ticket.userId,
              p2: e2.ticket.userId,
              gameMode: e1.ticket.gameMode,
              region: e1.ticket.region,
            });
            matched.add(i);
            matched.add(j);
            break;
          }
        }
      }
    }

    for (const match of matches) {
      this.removeFromQueue(match.p1);
      this.removeFromQueue(match.p2);
    }

    return matches;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueueStats(): { total: number; byRegion: Record<string, number>; avgElo: number } {
    const byRegion: Record<string, number> = {};
    let totalElo = 0;

    for (const entry of this.queue) {
      byRegion[entry.ticket.region] = (byRegion[entry.ticket.region] ?? 0) + 1;
      totalElo += entry.ticket.elo;
    }

    return {
      total: this.queue.length,
      byRegion,
      avgElo: this.queue.length > 0 ? Math.round(totalElo / this.queue.length) : 0,
    };
  }
}
