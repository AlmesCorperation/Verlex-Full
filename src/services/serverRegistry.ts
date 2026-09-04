import { GameServer, MapTemplateId } from '../types';

const STORAGE_KEY = 'verlex__active_servers_v2';

const DEFAULT_SERVERS: GameServer[] = [
  {
    id: 'srv_cr_1',
    roomCode: 'CR-777',
    mapId: 'crossroads',
    name: 'Crossroads Arena #1',
    hostName: 'Verlexian_Host',
    playerCount: 0,
    maxPlayers: 12,
    region: 'US-East',
    ping: 28,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'srv_cr_2',
    roomCode: 'CR-7778842',
    mapId: 'crossroads',
    name: 'Sword Fights on the Heights',
    hostName: 'Telamon',
    playerCount: 0,
    maxPlayers: 10,
    region: 'US-West',
    ping: 42,
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'srv_cc_1',
    roomCode: 'CC-4012',
    mapId: 'physics_lab',
    name: 'Chaos Canyon Battleground',
    hostName: 'Shedletsky',
    playerCount: 0,
    maxPlayers: 12,
    region: 'US-Central',
    ping: 35,
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'srv_hh_1',
    roomCode: 'HH-1024',
    mapId: 'happy_home',
    name: 'Happy Home Chill & Build',
    hostName: 'Builder_Joe',
    playerCount: 0,
    maxPlayers: 8,
    region: 'Europe',
    ping: 55,
    createdAt: Date.now() - 5400000,
  },
  {
    id: 'srv_bp_1',
    roomCode: 'BP-1337',
    mapId: 'baseplate',
    name: 'Baseplate Physics Testing Lab',
    hostName: 'Builderman',
    playerCount: 0,
    maxPlayers: 16,
    region: 'US-East',
    ping: 22,
    createdAt: Date.now() - 900000,
  },
  {
    id: 'srv_ob_1',
    roomCode: 'OB-7788',
    mapId: 'obby',
    name: 'Verlex Obstacle Course IV',
    hostName: 'Clockwork',
    playerCount: 0,
    maxPlayers: 10,
    region: 'US-East',
    ping: 31,
    createdAt: Date.now() - 2400000,
  },
];

class ServerRegistry {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(servers: GameServer[]) => void> = new Set();

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('verlex_servers_broadcast');
        this.channel.onmessage = (e) => {
          if (e.data && e.data.type === 'SERVERS_UPDATED') {
            this.notifyListeners();
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment');
    }
  }

  public getAllServers(): GameServer[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const custom: GameServer[] = JSON.parse(saved);
        // Combine default servers with custom ones (avoiding duplicate roomCodes)
        const combined = [...DEFAULT_SERVERS];
        custom.forEach((c) => {
          if (!combined.some((s) => s.roomCode.toUpperCase() === c.roomCode.toUpperCase())) {
            combined.push(c);
          }
        });
        return combined;
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SERVERS;
  }

  public getServersForMap(mapId: MapTemplateId): GameServer[] {
    return this.getAllServers().filter((s) => s.mapId === mapId);
  }

  public findServerByCode(code: string): GameServer | undefined {
    const clean = code.trim().toUpperCase();
    return this.getAllServers().find((s) => s.roomCode.toUpperCase() === clean);
  }

  public getDefaultServerForMap(mapId: MapTemplateId): GameServer {
    const servers = this.getServersForMap(mapId);
    if (servers.length > 0) return servers[0];

    const prefixMap: Record<MapTemplateId, string> = {
      crossroads: 'CR',
      physics_lab: 'CC',
      happy_home: 'HH',
      baseplate: 'BP',
      obby: 'OB',
      studio_map: 'ST',
    };
    const prefix = prefixMap[mapId] || 'VRX';
    const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: `srv_${mapId}_${Date.now()}`,
      roomCode: code,
      mapId: mapId,
      name: `${mapId.replace('_', ' ').toUpperCase()} Public Server`,
      hostName: 'Public_Host',
      playerCount: 1,
      maxPlayers: 12,
      region: 'US-East',
      ping: 30,
      createdAt: Date.now(),
    };
  }

  public createCustomServer(
    mapId: MapTemplateId,
    name: string,
    customCode?: string,
    hostName: string = 'Player',
    maxPlayers: number = 12
  ): GameServer {
    const prefixMap: Record<MapTemplateId, string> = {
      crossroads: 'CR',
      physics_lab: 'CC',
      happy_home: 'HH',
      baseplate: 'BP',
      obby: 'OB',
      studio_map: 'ST',
    };
    const prefix = prefixMap[mapId] || 'VRX';
    const cleanCode = customCode ? customCode.trim().toUpperCase() : `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newServer: GameServer = {
      id: `srv_${Date.now()}_${Math.random()}`,
      roomCode: cleanCode,
      mapId,
      name: name.trim() || `${hostName}'s ${mapId.replace('_', ' ')} Server`,
      hostName,
      playerCount: 1,
      maxPlayers,
      region: 'Global P2P',
      ping: 25,
      createdAt: Date.now(),
      isCustom: true,
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const customList: GameServer[] = saved ? JSON.parse(saved) : [];
      // Remove any existing with same code
      const filtered = customList.filter((s) => s.roomCode !== cleanCode);
      filtered.unshift(newServer);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
      this.channel?.postMessage({ type: 'SERVERS_UPDATED' });
    } catch (e) {
      console.warn('Failed to save custom server:', e);
    }

    this.notifyListeners();
    return newServer;
  }

  public updatePlayerCount(roomCode: string, count: number) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const customList: GameServer[] = JSON.parse(saved);
        const s = customList.find((x) => x.roomCode === roomCode.toUpperCase());
        if (s) {
          s.playerCount = count;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
          this.channel?.postMessage({ type: 'SERVERS_UPDATED' });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  public subscribe(callback: (servers: GameServer[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getAllServers());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const servers = this.getAllServers();
    this.listeners.forEach((cb) => cb(servers));
  }
}

export const serverRegistry = new ServerRegistry();
