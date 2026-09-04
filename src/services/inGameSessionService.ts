/**
 * In-Game Session Script Engine
 * Handles active session stats, powerup buffs, session timers, and world event hooks.
 */

export interface SessionBuff {
  id: string;
  name: string;
  icon: string;
  duration: number; // in seconds
  multiplier: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  score: number;
  studsCollected: number;
  kills: number;
  rankTitle: string;
  activeBuffs: SessionBuff[];
}

class InGameSessionService {
  private stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    score: 0,
    studsCollected: 0,
    kills: 0,
    rankTitle: 'Novice Builder',
    activeBuffs: [],
  };

  private sessionStartTime: number = Date.now();
  private listeners: (() => void)[] = [];
  private buffInterval: number | null = null;

  constructor() {
    this.startBuffTicker();
  }

  private startBuffTicker() {
    if (typeof window === 'undefined') return;
    this.buffInterval = window.setInterval(() => {
      if (this.stats.activeBuffs.length > 0) {
        this.stats.activeBuffs = this.stats.activeBuffs
          .map((b) => ({ ...b, duration: b.duration - 1 }))
          .filter((b) => b.duration > 0);
        this.notify();
      }
    }, 1000);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getStats(): PlayerStats {
    return { ...this.stats };
  }

  public updateHealth(hp: number, maxHp: number = 100) {
    this.stats.health = Math.max(0, Math.min(maxHp, hp));
    this.stats.maxHealth = maxHp;
    this.notify();
  }

  public addScore(amount: number) {
    this.stats.score += amount;
    this.recalculateRank();
    this.notify();
  }

  public addStuds(amount: number) {
    this.stats.studsCollected += amount;
    this.stats.score += amount * 10;
    this.recalculateRank();
    this.notify();
  }

  public addKill() {
    this.stats.kills += 1;
    this.stats.score += 100;
    this.recalculateRank();
    this.notify();
  }

  public applyBuff(buff: SessionBuff) {
    // Remove existing buff with same ID if present
    this.stats.activeBuffs = this.stats.activeBuffs.filter((b) => b.id !== buff.id);
    this.stats.activeBuffs.push(buff);
    this.notify();
  }

  public hasBuff(id: string): boolean {
    return this.stats.activeBuffs.some((b) => b.id === id);
  }

  private recalculateRank() {
    const s = this.stats.score;
    if (s > 2500) this.stats.rankTitle = 'Verlex Mastermind';
    else if (s > 1000) this.stats.rankTitle = 'Architect Lead';
    else if (s > 500) this.stats.rankTitle = 'Senior Builder';
    else if (s > 200) this.stats.rankTitle = 'Brick Constructor';
    else this.stats.rankTitle = 'Novice Builder';
  }

  public getSessionDurationString(): string {
    const elapsedSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  public resetSession() {
    this.stats = {
      health: 100,
      maxHealth: 100,
      score: 0,
      studsCollected: 0,
      kills: 0,
      rankTitle: 'Novice Builder',
      activeBuffs: [],
    };
    this.sessionStartTime = Date.now();
    this.notify();
  }
}

export const inGameSessionService = new InGameSessionService();
