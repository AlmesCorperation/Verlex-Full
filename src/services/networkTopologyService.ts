import { NetworkTopologyConfig, NetworkTopologyMode } from '../types';

const STORAGE_KEY = 'verlex_network_topology_config';

const defaultConfig: NetworkTopologyConfig = {
  topologyMode: 'p2p_mesh',
  targetTickRate: 60,
  interpolationBufferMs: 50,
  packetLossPercent: 0,
  latencyJitterMs: 5,
  bandwidthLimitKbps: 0, // unlimited
  maxPeerConnections: 12,
  protocolFormat: 'msgpack',
  enableDeltaCompression: true,
  enableEncryption: true,
  activePeersCount: 4,
};

class NetworkTopologyService {
  private config: NetworkTopologyConfig;
  private listeners: Array<(config: NetworkTopologyConfig) => void> = [];

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): NetworkTopologyConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultConfig, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse network topology config:', e);
    }
    return { ...defaultConfig };
  }

  public getConfig(): NetworkTopologyConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<NetworkTopologyConfig>): void {
    this.config = { ...this.config, ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    this.notify();
  }

  public resetToDefaults(): void {
    this.config = { ...defaultConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    this.notify();
  }

  public subscribe(listener: (config: NetworkTopologyConfig) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.config));
  }
}

export const networkTopologyService = new NetworkTopologyService();
