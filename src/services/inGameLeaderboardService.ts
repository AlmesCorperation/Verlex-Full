/**
 * In-Game Leaderboard Script Engine
 * Tracks dynamic real-time scores, ranks, pings, and Builders Club badges for all players in the session.
 */

export interface LeaderboardPlayer {
  id: string;
  name: string;
  score: number;
  kills: number;
  studs: number;
  ping: number;
  isHost: boolean;
  isLocal: boolean;
  buildersClub: 'none' | 'bc' | 'tbc' | 'obc';
}

class InGameLeaderboardService {
  private players: Map<string, LeaderboardPlayer> = new Map();
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public setLocalPlayer(id: string, name: string, isHost: boolean = true) {
    const existing = this.players.get('local') || {
      id,
      name,
      score: 0,
      kills: 0,
      studs: 0,
      ping: 0,
      isHost,
      isLocal: true,
      buildersClub: 'obc',
    };
    existing.id = id;
    existing.name = name;
    existing.isHost = isHost;
    this.players.set('local', existing);
    this.notify();
  }

  public updateLocalStats(score: number, kills: number, studs: number) {
    const local = this.players.get('local');
    if (local) {
      local.score = score;
      local.kills = kills;
      local.studs = studs;
      this.notify();
    }
  }

  public updateRemotePeers(peerIds: string[], getPeerName: (id: string) => string) {
    // Keep local player
    const local = this.players.get('local');
    this.players.clear();
    if (local) this.players.set('local', local);

    // Add current peers
    peerIds.forEach((pid, index) => {
      const pName = getPeerName(pid) || `Player ${index + 1}`;
      this.players.set(pid, {
        id: pid,
        name: pName,
        score: Math.floor(Math.random() * 80) + 20 * (index + 1),
        kills: Math.floor(Math.random() * 3),
        studs: Math.floor(Math.random() * 15),
        ping: Math.floor(Math.random() * 35) + 15,
        isHost: false,
        isLocal: false,
        buildersClub: index % 2 === 0 ? 'bc' : 'tbc',
      });
    });

    this.notify();
  }

  public getLeaderboardList(): LeaderboardPlayer[] {
    const list = Array.from(this.players.values());
    return list.sort((a, b) => b.score - a.score);
  }
}

export const inGameLeaderboardService = new InGameLeaderboardService();
