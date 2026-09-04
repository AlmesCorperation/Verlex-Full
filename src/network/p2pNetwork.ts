import { Peer, DataConnection } from 'peerjs';
import { ChatMessage, MapTemplateId, NetworkMessage, PartData, PlayerState } from '../types';

export class P2PNetwork {
  private peer: Peer | null = null;
  public myPeerId: string = '';
  public isHost: boolean = false;
  public roomCode: string = '';
  public currentMapId: MapTemplateId = 'crossroads';
  public myPlayerName: string = 'Player';
  public connections: Map<string, DataConnection> = new Map();
  public peerNames: Map<string, string> = new Map();
  public isConnected: boolean = false;
  public isConnecting: boolean = false;
  public pingMs: number = 25;

  // Callbacks
  public onPeerConnect?: (peerId: string) => void;
  public onPeerDisconnect?: (peerId: string) => void;
  public onPlayerStateReceived?: (peerId: string, state: Partial<PlayerState>) => void;
  public onFullMapReceived?: (parts: PartData[]) => void;
  public onPartAdded?: (part: PartData) => void;
  public onPartRemoved?: (partId: string) => void;
  public onPartUpdated?: (part: PartData) => void;
  public onRocketFired?: (data: { pos: [number, number, number]; dir: [number, number, number]; shooterId: string }) => void;
  public onExplosionTriggered?: (data: { pos: [number, number, number]; radius: number; force: number }) => void;
  public onPhysicsImpulseReceived?: (data: { partId: string; impulse: [number, number, number] }) => void;
  public onChatMessageReceived?: (msg: ChatMessage) => void;
  public onPlayerDamaged?: (data: { targetPeerId: string; amount: number; shooterId: string }) => void;
  public onCollabRequest?: (data: { senderId: string; senderName: string; emote: string }) => void;
  public onCollabAccept?: (data: { initiatorId: string; partnerId: string; partnerName: string; emote: string; rpsChoice?: string }) => void;
  public onCollabCancel?: (data: { senderId: string }) => void;
  public onStatusChange?: (status: string) => void;
  public onPlayerCountChange?: (count: number) => void;
  public onRequestMapSync?: () => PartData[];

  constructor() {
    // Empty constructor
  }

  /**
   * Universal join-or-host: Attempts to connect to existing room code host.
   * If no host is online for that code, smoothly becomes the Host of that join code.
   */
  public async joinOrCreateServer(
    roomCode: string,
    mapId: MapTemplateId,
    playerName: string
  ): Promise<{ success: boolean; isHost: boolean; roomCode: string }> {
    this.cleanup();
    this.isConnecting = true;
    this.myPlayerName = playerName;
    this.currentMapId = mapId;
    const cleanCode = roomCode.trim().toUpperCase();
    this.roomCode = cleanCode;

    this.onStatusChange?.(`Connecting to Server [${cleanCode}]...`);

    // 1. Try joining as client first
    const joined = await this.tryJoin(cleanCode);
    if (joined) {
      this.isHost = false;
      this.isConnected = true;
      this.isConnecting = false;
      this.onStatusChange?.(`Connected to Server [${cleanCode}]`);
      this.onPlayerCountChange?.(this.connections.size + 1);
      return { success: true, isHost: false, roomCode: cleanCode };
    }

    // 2. If client connection could not find host, host the server code
    this.onStatusChange?.(`Creating server instance [${cleanCode}]...`);
    const hostedCode = await this.hostRoom(cleanCode);
    this.isHost = true;
    this.isConnected = true;
    this.isConnecting = false;
    this.onStatusChange?.(`Hosting Server [${hostedCode}]`);
    this.onPlayerCountChange?.(1);

    return { success: true, isHost: true, roomCode: hostedCode };
  }

  /**
   * Connects to a host's room code
   */
  private tryJoin(cleanCode: string): Promise<boolean> {
    return new Promise((resolve) => {
      const targetHostPeerId = `verlex-room-${cleanCode.toLowerCase()}`;
      
      let resolved = false;
      let probePeer: Peer | null = null;

      const finish = (result: boolean) => {
        if (!resolved) {
          resolved = true;
          if (timer) clearTimeout(timer);

          if (!result && probePeer) {
            try {
              probePeer.removeAllListeners();
              probePeer.destroy();
            } catch (e) {
              // Ignore destroy errors on probe peer
            }
            if (this.peer === probePeer) {
              this.peer = null;
            }
          }
          resolve(result);
        }
      };

      const timer = setTimeout(() => {
        finish(false);
      }, 3500);

      try {
        probePeer = new Peer({
          debug: 0,
        });
        this.peer = probePeer;

        probePeer.on('open', (myId) => {
          this.myPeerId = myId;
          if (!probePeer) return;

          try {
            const conn = probePeer.connect(targetHostPeerId, {
              reliable: true,
            });

            conn.on('open', () => {
              this.setupConnection(conn);
              this.sendToPeer(conn.peer, {
                type: 'PLAYER_JOIN',
                senderId: this.myPeerId,
                payload: { name: this.myPlayerName },
              });
              finish(true);
            });

            conn.on('error', () => {
              finish(false);
            });
          } catch (e) {
            finish(false);
          }
        });

        probePeer.on('error', (err: any) => {
          // Expected when target room host is not online yet; suppress noise and proceed to host
          finish(false);
        });
      } catch (e) {
        finish(false);
      }
    });
  }

  /**
   * Initializes host room with a clean room code (e.g. CR-777)
   */
  public async hostRoom(customCode?: string): Promise<string> {
    this.cleanup();
    this.isConnecting = true;
    this.onStatusChange?.('Creating P2P Server...');

    const code = (customCode || `VRX-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
    this.roomCode = code;
    this.isHost = true;

    return new Promise((resolve, reject) => {
      const fullPeerId = `verlex-room-${code.toLowerCase()}`;
      
      this.peer = new Peer(fullPeerId, {
        debug: 0,
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        this.isConnected = true;
        this.isConnecting = false;
        this.onStatusChange?.(`Server active: ${this.roomCode}`);
        this.onPlayerCountChange?.(this.connections.size + 1);
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
        // If we have map data, automatically sync it to the newcomer
        if (this.onRequestMapSync) {
          const mapParts = this.onRequestMapSync();
          if (mapParts && mapParts.length > 0) {
            setTimeout(() => {
              this.sendToPeer(conn.peer, {
                type: 'FULL_MAP_SYNC',
                senderId: this.myPeerId,
                payload: mapParts,
              });
            }, 300);
          }
        }
      });

      this.peer.on('error', (err) => {
        console.warn('P2P Host Warning:', err);
        if (err.type === 'unavailable-id') {
          // Id collision: append random 2 digits
          const fallbackCode = `${code}-${Math.floor(10 + Math.random() * 89)}`;
          this.hostRoom(fallbackCode).then(resolve).catch(reject);
        } else {
          this.isConnecting = false;
          this.onStatusChange?.(`P2P local mode active (${err.message})`);
          resolve(this.roomCode);
        }
      });
    });
  }

  /**
   * Explicit client join method
   */
  public async joinRoom(roomCode: string): Promise<boolean> {
    const res = await this.joinOrCreateServer(roomCode, this.currentMapId, this.myPlayerName);
    return res.success;
  }

  private setupConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);
    this.onPeerConnect?.(conn.peer);
    this.onPlayerCountChange?.(this.connections.size + 1);

    conn.on('data', (data: any) => {
      this.handleIncomingMessage(conn.peer, data as NetworkMessage);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.peerNames.delete(conn.peer);
      this.onPeerDisconnect?.(conn.peer);
      this.onPlayerCountChange?.(this.connections.size + 1);
    });

    conn.on('error', (err) => {
      console.warn(`Connection error with ${conn.peer}:`, err);
      this.connections.delete(conn.peer);
      this.peerNames.delete(conn.peer);
      this.onPeerDisconnect?.(conn.peer);
      this.onPlayerCountChange?.(this.connections.size + 1);
    });
  }

  private handleIncomingMessage(senderPeerId: string, msg: NetworkMessage) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'PLAYER_JOIN':
        if (msg.payload?.name) {
          this.peerNames.set(senderPeerId, msg.payload.name);
        }
        if (this.isHost) {
          this.broadcast(msg, senderPeerId);
        }
        break;

      case 'PLAYER_SYNC':
        if (msg.payload?.name) {
          this.peerNames.set(senderPeerId, msg.payload.name);
        }
        this.onPlayerStateReceived?.(msg.senderId || senderPeerId, msg.payload);
        if (this.isHost) {
          this.broadcast(msg, senderPeerId);
        }
        break;

      case 'FULL_MAP_SYNC':
        this.onFullMapReceived?.(msg.payload);
        break;

      case 'PART_ADD':
        this.onPartAdded?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'PART_REMOVE':
        this.onPartRemoved?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'PART_UPDATE':
        this.onPartUpdated?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'ROCKET_FIRE':
        this.onRocketFired?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'EXPLOSION':
        this.onExplosionTriggered?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'PHYSICS_IMPULSE':
        this.onPhysicsImpulseReceived?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'CHAT_MESSAGE':
        this.onChatMessageReceived?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'DAMAGE_TAKEN':
        this.onPlayerDamaged?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'COLLAB_REQUEST':
        this.onCollabRequest?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'COLLAB_ACCEPT':
        this.onCollabAccept?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;

      case 'COLLAB_CANCEL':
        this.onCollabCancel?.(msg.payload);
        if (this.isHost) this.broadcast(msg, senderPeerId);
        break;
    }
  }

  public broadcast(msg: NetworkMessage, excludePeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(msg);
        } catch (e) {
          console.warn('Failed to send msg to peer:', peerId, e);
        }
      }
    });
  }

  public sendToPeer(peerId: string, msg: NetworkMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      try {
        conn.send(msg);
      } catch (e) {
        console.warn('Failed to send direct msg to peer:', peerId, e);
      }
    }
  }

  public syncPlayerState(state: Partial<PlayerState>) {
    if (!this.isConnected && this.connections.size === 0) return;
    this.broadcast({
      type: 'PLAYER_SYNC',
      senderId: this.myPeerId,
      payload: state,
    });
  }

  public broadcastPartAdd(part: PartData) {
    this.broadcast({
      type: 'PART_ADD',
      senderId: this.myPeerId,
      payload: part,
    });
  }

  public broadcastPartRemove(partId: string) {
    this.broadcast({
      type: 'PART_REMOVE',
      senderId: this.myPeerId,
      payload: partId,
    });
  }

  public broadcastPartUpdate(part: PartData) {
    this.broadcast({
      type: 'PART_UPDATE',
      senderId: this.myPeerId,
      payload: part,
    });
  }

  public broadcastRocket(pos: [number, number, number], dir: [number, number, number]) {
    this.broadcast({
      type: 'ROCKET_FIRE',
      senderId: this.myPeerId,
      payload: { pos, dir, shooterId: this.myPeerId },
    });
  }

  public broadcastExplosion(pos: [number, number, number], radius: number, force: number) {
    this.broadcast({
      type: 'EXPLOSION',
      senderId: this.myPeerId,
      payload: { pos, radius, force },
    });
  }

  public broadcastPhysicsImpulse(partId: string, impulse: [number, number, number]) {
    this.broadcast({
      type: 'PHYSICS_IMPULSE',
      senderId: this.myPeerId,
      payload: { partId, impulse },
    });
  }

  public broadcastChat(msg: ChatMessage) {
    this.broadcast({
      type: 'CHAT_MESSAGE',
      senderId: this.myPeerId,
      payload: msg,
    });
  }

  public broadcastDamageTaken(targetPeerId: string, amount: number) {
    this.broadcast({
      type: 'DAMAGE_TAKEN',
      senderId: this.myPeerId,
      payload: { targetPeerId, amount, shooterId: this.myPeerId },
    });
  }

  public broadcastCollabRequest(emote: string) {
    this.broadcast({
      type: 'COLLAB_REQUEST',
      senderId: this.myPeerId,
      payload: { senderId: this.myPeerId, senderName: this.myPlayerName, emote },
    });
  }

  public broadcastCollabAccept(initiatorId: string, emote: string, rpsChoice?: string) {
    this.broadcast({
      type: 'COLLAB_ACCEPT',
      senderId: this.myPeerId,
      payload: { initiatorId, partnerId: this.myPeerId, partnerName: this.myPlayerName, emote, rpsChoice },
    });
  }

  public broadcastCollabCancel() {
    this.broadcast({
      type: 'COLLAB_CANCEL',
      senderId: this.myPeerId,
      payload: { senderId: this.myPeerId },
    });
  }

  public cleanup() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    this.peerNames.clear();
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {
        // ignore
      }
      this.peer = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }
}

export const network = new P2PNetwork();
