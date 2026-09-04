import { MapTemplateId, PartData, RemixedPlace } from '../types';
import { createMap } from '../game/maps';

const STORAGE_KEY = 'verlex_remixed_places';

class RemixService {
  private remixedPlaces: RemixedPlace[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.remixedPlaces = this.loadPlaces();
  }

  private loadPlaces(): RemixedPlace[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse remixed places:', e);
    }
    return [];
  }

  public getRemixedPlaces(): RemixedPlace[] {
    return [...this.remixedPlaces];
  }

  public getPlaceById(id: string): RemixedPlace | undefined {
    return this.remixedPlaces.find((p) => p.id === id);
  }

  public remixGame(gameId: MapTemplateId, originalTitle: string, originalCreator: string, playerAuthor: string = 'Verlexian'): RemixedPlace {
    // 1. Fetch parts from the base template
    const baseParts = createMap(gameId);

    // 2. Build Python script template for remixed place
    const pythonCode = `# Remixed from ${originalTitle} by ${originalCreator}
import verlex

print("Initializing Remixed Place: ${originalTitle}...")

# Example: Custom scripting added during remix
def on_player_spawn(player):
    verlex.broadcast(f"Welcome to {player.name}'s Remixed {originalTitle}!")

verlex.on("player_spawn", on_player_spawn)
`;

    const remixedPlace: RemixedPlace = {
      id: `remix_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: `Remix of ${originalTitle}`,
      creator: playerAuthor,
      remixInfo: {
        isRemix: true,
        originalGameId: gameId,
        originalTitle: originalTitle,
        originalCreator: originalCreator,
        remixedAt: Date.now(),
      },
      parts: baseParts,
      pythonCode: pythonCode,
      networkConfig: {
        topologyMode: 'p2p_mesh',
        targetTickRate: 60,
        interpolationBufferMs: 50,
        packetLossPercent: 0,
        latencyJitterMs: 5,
        bandwidthLimitKbps: 0,
        maxPeerConnections: 12,
        protocolFormat: 'msgpack',
        enableDeltaCompression: true,
        enableEncryption: true,
        activePeersCount: 4,
      },
      updatedAt: Date.now(),
    };

    this.remixedPlaces.unshift(remixedPlace);
    this.save();
    this.notify();
    return remixedPlace;
  }

  public savePlace(place: RemixedPlace): void {
    const idx = this.remixedPlaces.findIndex((p) => p.id === place.id);
    if (idx >= 0) {
      this.remixedPlaces[idx] = { ...place, updatedAt: Date.now() };
    } else {
      this.remixedPlaces.unshift({ ...place, updatedAt: Date.now() });
    }
    this.save();
    this.notify();
  }

  public deletePlace(id: string): void {
    this.remixedPlaces = this.remixedPlaces.filter((p) => p.id !== id);
    this.save();
    this.notify();
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.remixedPlaces));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const remixService = new RemixService();
