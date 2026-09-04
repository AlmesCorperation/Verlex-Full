export type PartShape = 
  | 'block' 
  | 'wedge' 
  | 'cylinder' 
  | 'sphere' 
  | 'truss' 
  | 'spawn' 
  | 'trampoline' 
  | 'conveyor' 
  | 'tnt'
  | 'dummy';

export type PartMaterial = 
  | 'plastic' 
  | 'smooth' 
  | 'neon' 
  | 'wood' 
  | 'metal' 
  | 'glass' 
  | 'ice' 
  | 'forcefield';

export type SurfaceType = 'studs' | 'inlets' | 'smooth' | 'weld' | 'glue';

export interface PartData {
  id: string;
  name: string;
  shape: PartShape;
  position: [number, number, number]; // in studs (1 stud = 1 unit)
  size: [number, number, number]; // width (x), height (y), depth (z)
  rotation: [number, number, number]; // Euler angles in radians
  color: string; // Hex color
  material: PartMaterial;
  surfaceType: SurfaceType;
  anchored: boolean;
  canCollide: boolean;
  transparency: number; // 0 to 1
  reflectance: number; // 0 to 1
  elasticity?: number; // 0 to 2
  friction?: number;
  conveyorSpeed?: number; // studs/s
  ownerId?: string; // Player who placed it
  health?: number;
  maxHealth?: number;
}

export type AvatarHat = 
  | 'none' 
  | 'fedora' 
  | 'verlex_cap' 
  | 'roblox_cap' 
  | 'domino' 
  | 'visor' 
  | 'bandana' 
  | 'blockhead' 
  | 'horns' 
  | 'valkyrie' 
  | 'chef' 
  | 'teapot';

export type AvatarFace = 
  | 'smile' 
  | 'smirk' 
  | 'check_it' 
  | 'determined' 
  | 'oops' 
  | 'cool' 
  | 'epic' 
  | '' 
  | 'noob';

export type AvatarTShirt = 
  | 'verlex_v'
  | 'verlex_r' 
  | 'verlex_logo'
  | 'roblox_logo' 
  | 'bloxxer' 
  | 'builder' 
  | 'brick_smith' 
  | 'happy' 
  | 'none';

export type AvatarShirt =
  | 'none'
  | 'red_tuxedo'
  | 'verlex_hoodie'
  | 'galaxy_suit'
  | 'cyber_armor'
  | 'denim_jacket'
  | 'royalty_shirt'
  | 'flame_hoodie'
  | 'builder_shirt';

export type AvatarPants =
  | 'none'
  | 'blue_jeans'
  | 'cargo_pants'
  | 'tuxedo_slacks'
  | 'black_joggers'
  | 'royal_leggings'
  | 'cyber_pants'
  | 'shorts';

export interface AvatarConfig {
  headColor: string;
  torsoColor: string;
  leftArmColor: string;
  rightArmColor: string;
  leftLegColor: string;
  rightLegColor: string;
  face: AvatarFace;
  hat: AvatarHat;
  tshirt?: AvatarTShirt;
  shirt?: AvatarShirt | string;
  pants?: AvatarPants | string;
  ugcItems?: string[];
}

export interface UGCItem {
  id: string;
  name: string;
  type: 'shirt' | 'pants' | 'tshirt' | 'hat' | 'accessory';
  category: string;
  creator: string;
  price: number;
  currency: 'V$' | 'TIX';
  pattern: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  createdAt: number;
  salesCount: number;
}

export type NetworkTopologyMode = 
  | 'p2p_mesh' 
  | 'authoritative_server' 
  | 'relay_matrix' 
  | 'hybrid_star';

export interface NetworkTopologyConfig {
  topologyMode: NetworkTopologyMode;
  targetTickRate: 30 | 60 | 120 | 240;
  interpolationBufferMs: number;
  packetLossPercent: number;
  latencyJitterMs: number;
  bandwidthLimitKbps: number;
  maxPeerConnections: number;
  protocolFormat: 'json' | 'msgpack' | 'flatbuffers';
  enableDeltaCompression: boolean;
  enableEncryption: boolean;
  activePeersCount: number;
}

export interface RemixInfo {
  isRemix: boolean;
  originalGameId: string;
  originalTitle: string;
  originalCreator: string;
  remixedAt: number;
}

export interface RemixedPlace {
  id: string;
  title: string;
  creator: string;
  remixInfo: RemixInfo;
  parts: PartData[];
  pythonCode: string;
  networkConfig: NetworkTopologyConfig;
  updatedAt: number;
}

export type SitePage = 'home' | 'games' | 'catalog' | 'myverlex_verlex' | 'my_verlex' | 'builders_club' | 'forum' | 'play' | 'studio' | 'filter_trainer' | 'friends';

export type AnimState = 
  | 'idle' | 'walk' | 'jump' | 'fall' | 'wave' | 'dance' | 'sit' | 'sword_slash' | 'tool_hold'
  | 'highfive_wait' | 'highfive_snap'
  | 'hug_wait' | 'hug_snap'
  | 'rps_wait' | 'rps_rock' | 'rps_paper' | 'rps_scissors'
  | 'duodance_1' | 'duodance_2'
  | 'carry_base' | 'carry_rider';

export type CollabEmoteType = 'highfive' | 'hug' | 'rps' | 'duodance' | 'carry';
export type ToolType = 'select' | 'build' | 'gravity' | 'rocket' | 'sword' | 'paint' | 'push' | 'delete';

export interface PlayerState {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number]; // Euler Y rotation primarily
  velocity: [number, number, number];
  avatar: AvatarConfig;
  animState: AnimState;
  animTimer?: number;
  equippedTool: ToolType;
  health: number;
  maxHealth: number;
  ping: number;
  isHost: boolean;
  score: number;
  chatBubble?: {
    text: string;
    expiresAt: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Projectile {
  id: string;
  type: 'rocket' | 'debris' | 'slingshot';
  position: [number, number, number];
  velocity: [number, number, number];
  shooterId: string;
  lifetime: number;
}

export type MapTemplateId = 'crossroads' | 'physics_lab' | 'happy_home' | 'baseplate' | 'obby' | 'studio_map';

export interface GameServer {
  id: string;
  roomCode: string;
  mapId: MapTemplateId;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  region: string;
  ping: number;
  createdAt: number;
  isCustom?: boolean;
}

export interface NetworkMessage {
  type: 
    | 'PLAYER_JOIN'
    | 'PLAYER_LEAVE'
    | 'PLAYER_SYNC'
    | 'FULL_MAP_SYNC'
    | 'PART_ADD'
    | 'PART_REMOVE'
    | 'PART_UPDATE'
    | 'PHYSICS_IMPULSE'
    | 'ROCKET_FIRE'
    | 'EXPLOSION'
    | 'CHAT_MESSAGE'
    | 'EMOTE'
    | 'COLLAB_REQUEST'
    | 'COLLAB_ACCEPT'
    | 'COLLAB_CANCEL'
    | 'DAMAGE_TAKEN';
  senderId: string;
  payload: any;
}
