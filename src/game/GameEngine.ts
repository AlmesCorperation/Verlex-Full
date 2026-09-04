import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { 
  AnimState, 
  AvatarConfig, 
  CollabEmoteType,
  MapTemplateId, 
  PartData, 
  PartMaterial, 
  PartShape, 
  PlayerState, 
  Projectile, 
  SurfaceType, 
  ToolType 
} from '../types';
import { AvatarRig } from './avatarRig';
import { MeshFactory } from './meshFactory';
import { PhysicsWorld } from './physicsWorld';
import { sounds } from './soundEngine';
import { createMap } from './maps';
import { network } from '../network/p2pNetwork';
import confetti from 'canvas-confetti';

export interface GameEngineCallbacks {
  onSelectedPartChange: (part: PartData | null) => void;
  onPlayerStatsChange: (health: number, maxHealth: number, score: number) => void;
  onActiveToolChange: (tool: ToolType) => void;
}

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public physics: PhysicsWorld;
  
  // Meshes & Entities
  public partMeshes: Map<string, THREE.Mesh> = new Map();
  public partsData: Map<string, PartData> = new Map();
  public remotePlayers: Map<string, AvatarRig> = new Map();
  public localAvatar: AvatarRig;
  
  // Selection & Ghost Building
  public selectedPartId: string | null = null;
  public selectionBox: THREE.BoxHelper | null = null;
  public ghostMesh: THREE.Mesh | null = null;
  
  // Tool Configs
  public activeTool: ToolType = 'select';
  public buildShape: PartShape = 'block';
  public buildColor: string = '#e74c3c';
  public buildMaterial: PartMaterial = 'plastic';
  public buildSurfaceType: SurfaceType = 'studs';
  public buildSize: [number, number, number] = [4, 2, 4];
  public buildAnchored: boolean = false;
  public buildRotationAngle: number = 0; // 0, 90, 180, 270 deg
  public gridSnap: number = 2; // in studs
  public resolutionScale: number = 1.0;
  
  // Controls & Camera State
  public keysPressed: Set<string> = new Set();
  public virtualJoystickMove: THREE.Vector2 = new THREE.Vector2();
  public virtualJumpPressed: boolean = false;
  public mousePos: THREE.Vector2 = new THREE.Vector2();
  public isRightMouseDown: boolean = false;
  public shiftLockEnabled: boolean = false;
  public cameraDistance: number = 14;
  public cameraPitch: number = 0.3; // vertical angle
  public cameraYaw: number = 0; // horizontal angle
  
  // Player Gameplay State
  public myPlayerId: string = `player_${Math.floor(1000 + Math.random() * 9000)}`;
  public playerName: string = 'Player1';
  public avatarConfig: AvatarConfig;
  public health: number = 100;
  public maxHealth: number = 100;
  public score: number = 0;
  public isDead: boolean = false;
  public deathPos: THREE.Vector3 = new THREE.Vector3();
  public respawnTimer: number = 0;
  public isGrounded: boolean = true;
  public isClimbingTruss: boolean = false;
  public currentAnim: AnimState = 'idle';
  public animTimer: number = 0;
  
  // Collab Emotes State
  public activeCollabReq: { emote: CollabEmoteType; initiatorId: string; timer: number } | null = null;
  public botCompanionAvatar: AvatarRig | null = null;
  public activeCollabPartnerId: string | null = null;
  public activeCollabRole: 'initiator' | 'partner' | null = null;
  public activeCollabEmote: CollabEmoteType | null = null;
  
  // Projectiles & Particles
  public projectiles: Projectile[] = [];
  public projectileMeshes: Map<string, THREE.Mesh> = new Map();
  public particleGroup: THREE.Group = new THREE.Group();
  public gravityBeamLine: THREE.Line | null = null;
  
  // Internal Timing
  private lastTime: number = performance.now();
  private animationFrameId: number | null = null;
  private networkSyncTimer: number = 0;
  private callbacks: GameEngineCallbacks;

  // Cleanup & Resize
  private resizeObserver: ResizeObserver | null = null;
  private cleanups: (() => void)[] = [];

  constructor(container: HTMLElement, playerName: string, avatarConfig: AvatarConfig, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.playerName = playerName;
    this.avatarConfig = avatarConfig;
    this.callbacks = callbacks;

    // Clear any previous child canvas elements in container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x70c5ff); // Verlex sky blue
    this.scene.fog = new THREE.FogExp2(0x70c5ff, 0.0035);

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
    this.camera.position.set(0, 8, 14);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Apply strict absolute positioning to ensure canvas fills container without layout shift
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.outline = 'none';
    this.renderer.domElement.tabIndex = 0;

    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.focus();

    // 4. Lighting Setup
    this.setupLighting();

    // 5. Physics Setup
    this.physics = new PhysicsWorld();

    // 6. Local Avatar Setup
    this.localAvatar = new AvatarRig(this.playerName, avatarConfig);
    this.scene.add(this.localAvatar.rootGroup);

    // 7. Particles & Beams
    this.scene.add(this.particleGroup);
    this.setupGravityBeam();

    // 8. Ghost Mesh for Building
    this.setupGhostMesh();

    // 9. Attach Event Listeners
    this.setupEventListeners();

    // 10. Load Default Map (Crossroads)
    this.loadMap('crossroads');

    // 11. Hook up P2P Network Handlers
    this.setupNetworkHandlers();

    // 12. Start Animation Loop
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.85);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 300;
    const d = 80;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);
  }

  private setupGhostMesh() {
    const geo = new THREE.BoxGeometry(4, 2, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    this.ghostMesh = new THREE.Mesh(geo, mat);
    this.ghostMesh.visible = false;
    this.scene.add(this.ghostMesh);
  }

  private setupGravityBeam() {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.8,
    });
    this.gravityBeamLine = new THREE.Line(geo, mat);
    this.gravityBeamLine.visible = false;
    this.scene.add(this.gravityBeamLine);
  }

  public loadMap(template: MapTemplateId, customParts?: PartData[]) {
    // Clear existing parts
    this.partMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.partMeshes.clear();
    this.partsData.clear();
    
    // Clear physics bodies (except character)
    this.physics.bodies.forEach((body, id) => {
      this.physics.removePartBody(id);
    });

    const parts = createMap(template, customParts);
    parts.forEach((part) => {
      this.addPart(part, false);
    });

    // Reset player position to safe spawn location
    this.respawnPlayer();
  }

  public addPart(part: PartData, broadcast: boolean = true) {
    this.partsData.set(part.id, part);
    
    // Create Three.js Mesh
    const mesh = MeshFactory.createPartMesh(part);
    this.partMeshes.set(part.id, mesh);
    this.scene.add(mesh);

    // Create Cannon-es Physics Body
    this.physics.syncPartBody(part);

    if (broadcast) {
      network.broadcastPartAdd(part);
      sounds.playPlaceBrick();
    }
  }

  public removePart(partId: string, broadcast: boolean = true) {
    const mesh = this.partMeshes.get(partId);
    if (mesh) {
      this.scene.remove(mesh);
      this.partMeshes.delete(partId);
    }
    this.partsData.delete(partId);
    this.physics.removePartBody(partId);

    if (this.selectedPartId === partId) {
      this.setSelectedPart(null);
    }

    if (broadcast) {
      network.broadcastPartRemove(partId);
      sounds.playDeleteBrick();
    }
  }

  public updatePart(part: PartData, broadcast: boolean = true) {
    this.removePart(part.id, false);
    this.addPart(part, false);

    if (this.selectedPartId === part.id) {
      this.setSelectedPart(part);
    }

    if (broadcast) {
      network.broadcastPartUpdate(part);
    }
  }

  public triggerWorldEvent(eventType: 'gravity' | 'rain' | 'nuke' | 'tsunami') {
    switch (eventType) {
      case 'gravity': {
        const currentGravY = this.physics.world.gravity.y;
        const newGravY = currentGravY === -32 ? -5.3 : -32;
        this.physics.world.gravity.set(0, newGravY, 0);
        
        // Wake up all sleeping bodies
        this.physics.world.bodies.forEach(b => b.wakeUp());

        this.displayChatBubble(newGravY === -5.3 ? "Gravity set to Lunar Low!" : "Gravity restored to normal!");
        break;
      }
      
      case 'rain': {
        let count = 0;
        const interval = setInterval(() => {
          if (count >= 30) {
            clearInterval(interval);
            return;
          }
          const randomX = (Math.random() - 0.5) * 80;
          const randomZ = (Math.random() - 0.5) * 80;
          const randomColor = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)];
          const randomShape = ['block', 'sphere', 'cylinder'][Math.floor(Math.random() * 3)] as any;
          
          const meteorPart: PartData = {
            id: `meteor_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: `Meteor_${count}`,
            shape: randomShape,
            color: randomColor,
            material: 'plastic',
            surfaceType: 'studs',
            position: [randomX, 35, randomZ],
            size: [3, 3, 3],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
            anchored: false,
            canCollide: true,
            transparency: 0,
            reflectance: 0,
          };
          this.addPart(meteorPart, true);
          count++;
        }, 150);
        this.displayChatBubble("Raining dynamic bricks from the heavens!");
        break;
      }
      
      case 'tsunami': {
        this.displayChatBubble("WARNING: PHYSICS TSUNAMI INBOUND!");
        for (let i = -10; i <= 10; i++) {
          setTimeout(() => {
            const wavePart: PartData = {
              id: `tsunami_block_${Date.now()}_${i}`,
              name: `Tsunami_Block_${i}`,
              shape: 'block',
              color: '#06b6d4',
              material: 'ice',
              surfaceType: 'smooth',
              position: [i * 5, 8, -45],
              size: [4, 4, 4],
              rotation: [0, 0, 0],
              anchored: false,
              canCollide: true,
              transparency: 0.1,
              reflectance: 0.2,
            };
            this.addPart(wavePart, true);
            setTimeout(() => {
              this.physics.applyBodyImpulse(wavePart.id, [0, 5, 45]);
            }, 100);
          }, Math.abs(i) * 60);
        }
        break;
      }
      
      case 'nuke': {
        this.displayChatBubble("DETONATING ALL DYNAMIC ARENA BLOCKS!");
        sounds.playExplosion();
        
        this.physics.bodies.forEach((body, partId) => {
          if (partId !== 'character' && body.type === CANNON.Body.DYNAMIC) {
            const forceX = (body.position.x) * 1.5 + (Math.random() - 0.5) * 15;
            const forceZ = (body.position.z) * 1.5 + (Math.random() - 0.5) * 15;
            const forceY = 25 + Math.random() * 20;
            this.physics.applyBodyImpulse(partId, [forceX, forceY, forceZ]);
          }
        });
        break;
      }
    }
  }

  public setSelectedPart(part: PartData | null) {
    this.selectedPartId = part ? part.id : null;
    
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox.dispose();
      this.selectionBox = null;
    }

    if (part) {
      const mesh = this.partMeshes.get(part.id);
      if (mesh) {
        // Verlex blue bounding selection box outline
        this.selectionBox = new THREE.BoxHelper(mesh, 0x00a8ff);
        this.scene.add(this.selectionBox);
      }
    }

    this.callbacks.onSelectedPartChange(part);
  }

  public setTool(tool: ToolType) {
    this.activeTool = tool;
    this.localAvatar.setEquippedTool(tool);
    this.callbacks.onActiveToolChange(tool);

    if (this.physics.heldBodyId) {
      this.physics.toggleGrabBody(null);
    }

    if (this.ghostMesh) {
      this.ghostMesh.visible = tool === 'build';
    }

    if (tool === 'sword') {
      sounds.playSwordSlash();
    }
  }

  public respawnPlayer() {
    // Find a spawn plate or fallback to (0, 3.0, 0)
    let spawnPos: [number, number, number] = [0, 3.0, 0];
    for (const part of this.partsData.values()) {
      if (part.shape === 'spawn') {
        spawnPos = [part.position[0], part.position[1] + 2.5, part.position[2]];
        break;
      }
    }

    this.physics.characterBody.position.set(spawnPos[0], spawnPos[1], spawnPos[2]);
    this.physics.characterBody.velocity.set(0, 0, 0);
    this.physics.characterBody.angularVelocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.isDead = false;
    this.localAvatar.rootGroup.visible = true;
    this.callbacks.onPlayerStatsChange(this.health, this.maxHealth, this.score);
    this.localAvatar.updateNameTag(this.playerName, this.health, this.maxHealth);
  }

  public damagePlayer(amount: number) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.callbacks.onPlayerStatsChange(this.health, this.maxHealth, this.score);
    this.localAvatar.updateNameTag(this.playerName, this.health, this.maxHealth);

    if (this.health <= 0) {
      this.triggerRagdollDeath();
    }
  }

  public triggerRagdollDeath() {
    if (this.isDead) return;
    this.isDead = true;
    this.respawnTimer = 4.0; // 4 seconds of ragdoll!

    const charPos = this.physics.characterBody.position;
    this.deathPos.set(charPos.x, charPos.y, charPos.z);

    // Hide local avatar visually
    this.localAvatar.rootGroup.visible = false;

    // Freeze local physical simulation of the player capsule so they don't roll around
    this.physics.characterBody.velocity.set(0, 0, 0);
    this.physics.characterBody.angularVelocity.set(0, 0, 0);

    sounds.playOof();

    // Spawn ragdoll burial site
    this.spawnRagdollBurialSite(this.deathPos);
  }

  private spawnRagdollBurialSite(pos: THREE.Vector3) {
    // Height correction so it doesn't build deep in the void
    const clampedY = Math.max(0.5, pos.y);
    const tombstoneId = `tombstone_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const tombstone: PartData = {
      id: tombstoneId,
      name: `🪦 ${this.playerName}`,
      shape: 'block',
      position: [pos.x, clampedY + 1.2, pos.z],
      size: [2.5, 2.4, 0.6],
      rotation: [0, Math.random() * Math.PI, 0],
      color: '#4b5563', // stone gray
      material: 'smooth',
      surfaceType: 'smooth',
      anchored: true,
      canCollide: true,
      transparency: 0,
      reflectance: 0.1,
    };
    this.addPart(tombstone, true);

    const colors = {
      head: this.avatarConfig?.headColor || '#f5dc3d',
      torso: this.avatarConfig?.torsoColor || '#0055ff',
      leftArm: this.avatarConfig?.leftArmColor || '#f5dc3d',
      rightArm: this.avatarConfig?.rightArmColor || '#f5dc3d',
      leftLeg: this.avatarConfig?.leftLegColor || '#3d7a3d',
      rightLeg: this.avatarConfig?.rightLegColor || '#3d7a3d',
    };

    const partsToSpawn = [
      { name: 'Corpse Torso', size: [1.6, 2.0, 0.8], color: colors.torso, offset: [0, 1.5, 0.2] },
      { name: 'Corpse Head', size: [1.0, 1.0, 1.0], color: colors.head, offset: [0.1, 2.7, 0.3] },
      { name: 'Corpse L-Arm', size: [0.8, 1.8, 0.8], color: colors.leftArm, offset: [-1.2, 1.5, -0.1] },
      { name: 'Corpse R-Arm', size: [0.8, 1.8, 0.8], color: colors.rightArm, offset: [1.2, 1.5, -0.1] },
      { name: 'Corpse L-Leg', size: [0.8, 1.8, 0.8], color: colors.leftLeg, offset: [-0.5, 0.5, 0.1] },
      { name: 'Corpse R-Leg', size: [0.8, 1.8, 0.8], color: colors.rightLeg, offset: [0.5, 0.5, 0.1] },
    ];

    partsToSpawn.forEach((p, idx) => {
      const partId = `ragdoll_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`;
      const part: PartData = {
        id: partId,
        name: p.name,
        shape: p.name === 'Corpse Head' ? 'sphere' : 'block',
        position: [pos.x + p.offset[0], clampedY + p.offset[1], pos.z + p.offset[2]],
        size: p.size as [number, number, number],
        rotation: [
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
        ],
        color: p.color,
        material: 'plastic',
        surfaceType: 'smooth',
        anchored: false,
        canCollide: true,
        transparency: 0,
        reflectance: 0.1,
      };

      this.addPart(part, true);

      setTimeout(() => {
        const force: [number, number, number] = [
          (Math.random() - 0.5) * 10,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 10,
        ];
        this.physics.applyBodyImpulse(part.id, force);
        network.broadcastPhysicsImpulse(part.id, force);
      }, 50);
    });
  }

  public triggerEmote(emote: 'dance' | 'wave' | 'cheer' | 'sit' | CollabEmoteType) {
    if (emote === 'highfive' || emote === 'hug' || emote === 'rps' || emote === 'duodance' || emote === 'carry') {
      this.triggerCollabEmote(emote as CollabEmoteType);
      return;
    }

    this.localAvatar.clearCollabPrompt();
    this.activeCollabReq = null;

    if (emote === 'sit') {
      this.currentAnim = 'sit';
      this.animTimer = 30.0;
    } else if (emote === 'dance') {
      this.currentAnim = 'dance';
      this.animTimer = 6.0;
    } else if (emote === 'wave') {
      this.currentAnim = 'wave';
      this.animTimer = 3.0;
    } else if (emote === 'cheer') {
      this.currentAnim = 'jump';
      this.animTimer = 2.0;
      sounds.playCheer();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  public triggerCollabEmote(emote: CollabEmoteType) {
    this.activeCollabReq = {
      emote,
      initiatorId: network.myPeerId || 'local_player',
      timer: 15.0,
    };

    if (emote === 'highfive') this.currentAnim = 'highfive_wait';
    else if (emote === 'hug') this.currentAnim = 'hug_wait';
    else if (emote === 'rps') this.currentAnim = 'rps_wait';
    else if (emote === 'duodance') this.currentAnim = 'duodance_1';
    else if (emote === 'carry') this.currentAnim = 'carry_base';

    this.animTimer = 15.0;

    const labelMap: Record<CollabEmoteType, string> = {
      highfive: '✋ HIGH FIVE ME!',
      hug: '🫂 DUO HUG!',
      rps: '✊ ROCK PAPER SCISSORS!',
      duodance: '💃 DUO DANCE!',
      carry: '🎒 PIGGYBACK RIDE!',
    };

    this.localAvatar.showCollabPrompt(labelMap[emote], 'Press [E] nearby to join!');
    network.broadcastCollabRequest(emote);
    this.displayChatBubble(`Waiting for ${labelMap[emote]}! Press [E] nearby!`);

    // If solo / 0 remote players, trigger companion bot fallback after 2.2s
    if (this.remotePlayers.size === 0) {
      setTimeout(() => {
        if (this.activeCollabReq && this.activeCollabReq.emote === emote) {
          this.executeBotCompanionCollab(emote);
        }
      }, 2200);
    }
  }

  public tryJoinCollabEmote(): boolean {
    const myPos = this.physics.characterBody.position;

    // 1. Check if a remote player nearby is waiting for a collab emote
    let targetPeerId: string | null = null;
    let targetEmote: CollabEmoteType | null = null;

    this.remotePlayers.forEach((avatar, peerId) => {
      const dist = avatar.rootGroup.position.distanceTo(new THREE.Vector3(myPos.x, myPos.y, myPos.z));
      const targetAnim = (avatar as any).targetAnimState;
      if (dist < 9.0) {
        if (targetAnim === 'highfive_wait') { targetPeerId = peerId; targetEmote = 'highfive'; }
        else if (targetAnim === 'hug_wait') { targetPeerId = peerId; targetEmote = 'hug'; }
        else if (targetAnim === 'rps_wait') { targetPeerId = peerId; targetEmote = 'rps'; }
        else if (targetAnim === 'duodance_1') { targetPeerId = peerId; targetEmote = 'duodance'; }
        else if (targetAnim === 'carry_base') { targetPeerId = peerId; targetEmote = 'carry'; }
      }
    });

    if (targetPeerId && targetEmote) {
      let rpsChoice: string | undefined;
      if (targetEmote === 'rps') {
        const choices = ['rock', 'paper', 'scissors'];
        rpsChoice = choices[Math.floor(Math.random() * choices.length)];
      }
      network.broadcastCollabAccept(targetPeerId, targetEmote, rpsChoice);
      this.performCollabSequence(targetEmote, targetPeerId, false, rpsChoice);
      return true;
    }

    // 2. If local player is initiating, allow pressing E to complete immediately with Bot Companion
    if (this.activeCollabReq) {
      this.executeBotCompanionCollab(this.activeCollabReq.emote);
      return true;
    }

    return false;
  }

  public performCollabSequence(emote: CollabEmoteType, partnerId: string, isInitiator: boolean, partnerRpsChoice?: string) {
    this.localAvatar.clearCollabPrompt();
    this.activeCollabReq = null;
    this.activeCollabPartnerId = partnerId;
    this.activeCollabRole = isInitiator ? 'initiator' : 'partner';
    this.activeCollabEmote = emote;

    const partnerName = network.peerNames.get(partnerId) || (partnerId === 'bot' ? 'BuildBot' : 'Player');

    // Snap & align positions if local player joined a partner
    if (!isInitiator && partnerId !== 'bot') {
      const partnerAvatar = this.remotePlayers.get(partnerId);
      if (partnerAvatar) {
        const initPos = partnerAvatar.rootGroup.position;
        const initYaw = partnerAvatar.rootGroup.rotation.y;

        let dist = 1.35;
        let rotOffset = Math.PI;
        let isSide = false;

        if (emote === 'hug') dist = 0.9;
        else if (emote === 'rps') dist = 1.5;
        else if (emote === 'duodance') { isSide = true; dist = 1.3; rotOffset = 0; }
        else if (emote === 'carry') { dist = -0.35; rotOffset = 0; }

        let targetX = initPos.x - Math.sin(initYaw) * dist;
        let targetZ = initPos.z - Math.cos(initYaw) * dist;
        let targetY = initPos.y + 2.1;

        if (isSide) {
          targetX = initPos.x + Math.cos(initYaw) * dist;
          targetZ = initPos.z - Math.sin(initYaw) * dist;
        } else if (emote === 'carry') {
          targetY = initPos.y + 2.1 + 1.25;
        }

        this.physics.characterBody.position.set(targetX, targetY, targetZ);
        this.physics.characterBody.velocity.set(0, 0, 0);
        this.cameraYaw = initYaw + rotOffset - Math.PI;
      }
    }

    if (emote === 'highfive') {
      this.currentAnim = 'highfive_snap';
      this.animTimer = 2.0;
      sounds.playHighFive();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#facc15', '#2ecc71', '#e11d48'],
      });
      this.displayChatBubble(`🎉 High Fived with ${partnerName}!`);
    } else if (emote === 'hug') {
      this.currentAnim = 'hug_snap';
      this.animTimer = 2.5;
      sounds.playCollabChime();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#fb7185'],
      });
      this.displayChatBubble(`❤️ Shared a warm Hug with ${partnerName}!`);
    } else if (emote === 'rps') {
      const choices = ['rock', 'paper', 'scissors'];
      const myChoice = choices[Math.floor(Math.random() * choices.length)];
      this.currentAnim = `rps_${myChoice}` as AnimState;
      this.animTimer = 3.5;
      sounds.playCollabChime();

      const otherChoice = partnerRpsChoice || choices[Math.floor(Math.random() * choices.length)];
      
      let outcome = "🤝 It's a Tie!";
      if (myChoice === otherChoice) {
        outcome = `🤝 Both played ${myChoice.toUpperCase()}! Tie!`;
      } else if (
        (myChoice === 'rock' && otherChoice === 'scissors') ||
        (myChoice === 'paper' && otherChoice === 'rock') ||
        (myChoice === 'scissors' && otherChoice === 'paper')
      ) {
        outcome = `🏆 You (${myChoice.toUpperCase()}) beat ${partnerName} (${otherChoice.toUpperCase()})!`;
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } else {
        outcome = `😅 ${partnerName} (${otherChoice.toUpperCase()}) beat You (${myChoice.toUpperCase()})!`;
      }

      this.displayChatBubble(outcome);
    } else if (emote === 'duodance') {
      this.currentAnim = isInitiator ? 'duodance_1' : 'duodance_2';
      this.animTimer = 6.0;
      sounds.playCheer();
      confetti({
        particleCount: 110,
        spread: 100,
        origin: { y: 0.6 },
      });
      this.displayChatBubble(`💃 Synchronized Duo Dance with ${partnerName}!`);
    } else if (emote === 'carry') {
      this.currentAnim = isInitiator ? 'carry_base' : 'carry_rider';
      this.animTimer = 8.0;
      sounds.playCollabChime();
      this.displayChatBubble(isInitiator ? `🎒 Carrying ${partnerName} on back!` : `🎒 Riding on ${partnerName}'s back!`);
    }
  }

  public executeBotCompanionCollab(emote: CollabEmoteType) {
    if (this.botCompanionAvatar) {
      this.scene.remove(this.botCompanionAvatar.rootGroup);
      this.botCompanionAvatar = null;
    }

    const myPos = this.physics.characterBody.position;
    const myYaw = this.localAvatar.rootGroup.rotation.y;

    let botDist = 1.35;
    let botYawOffset = Math.PI;
    let isSide = false;

    if (emote === 'hug') botDist = 0.9;
    else if (emote === 'rps') botDist = 1.5;
    else if (emote === 'duodance') { isSide = true; botDist = 1.3; botYawOffset = 0; }
    else if (emote === 'carry') { botDist = -0.35; botYawOffset = 0; }

    let botX = myPos.x - Math.sin(myYaw) * botDist;
    let botZ = myPos.z - Math.cos(myYaw) * botDist;
    let botY = myPos.y - 2.1;

    if (isSide) {
      botX = myPos.x + Math.cos(myYaw) * botDist;
      botZ = myPos.z - Math.sin(myYaw) * botDist;
    } else if (emote === 'carry') {
      botY = myPos.y - 2.1 + 1.25;
    }

    const botAvatar = new AvatarRig('BuildBot', {
      headColor: '#38bdf8',
      torsoColor: '#0284c7',
      leftArmColor: '#facc15',
      rightArmColor: '#facc15',
      leftLegColor: '#0f172a',
      rightLegColor: '#0f172a',
      face: 'smile',
      hat: 'roblox_cap',
    });

    botAvatar.setPositionAndRotation([botX, botY, botZ], myYaw + botYawOffset);
    this.scene.add(botAvatar.rootGroup);
    this.botCompanionAvatar = botAvatar;

    const botAnims: Record<CollabEmoteType, AnimState> = {
      highfive: 'highfive_snap',
      hug: 'hug_snap',
      rps: 'rps_paper',
      duodance: 'duodance_2',
      carry: 'carry_rider',
    };

    botAvatar.updateAnimation(0, botAnims[emote], 0);
    this.performCollabSequence(emote, 'bot', true);

    setTimeout(() => {
      if (this.botCompanionAvatar) {
        this.scene.remove(this.botCompanionAvatar.rootGroup);
        this.botCompanionAvatar = null;
      }
    }, 4500);
  }

  public displayChatBubble(text: string) {
    this.localAvatar.updateNameTag(`${this.playerName}: "${text}"`, this.health, this.maxHealth);
    setTimeout(() => {
      this.localAvatar.updateNameTag(this.playerName, this.health, this.maxHealth);
    }, 4000);
  }

  private setupEventListeners() {
    const el = this.renderer.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      // Prevent browser default scrolling or focus loss for game controls
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Tab'].includes(e.code) || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      this.keysPressed.add(e.code);
      if (e.key) {
        this.keysPressed.add(e.key.toLowerCase());
        this.keysPressed.add(e.key);
      }

      // Tool shortcuts (1 - 8)
      if (e.key === '1') this.setTool('select');
      else if (e.key === '2') this.setTool('build');
      else if (e.key === '3') this.setTool('gravity');
      else if (e.key === '4') this.setTool('rocket');
      else if (e.key === '5') this.setTool('sword');
      else if (e.key === '6') this.setTool('paint');
      else if (e.key === '7') this.setTool('push');
      else if (e.key === '8') this.setTool('delete');

      // Rotate Ghost Brick (R)
      if ((e.code === 'KeyR' || e.key?.toLowerCase() === 'r') && this.activeTool === 'build') {
        this.buildRotationAngle = (this.buildRotationAngle + Math.PI / 2) % (Math.PI * 2);
      }

      // Interact / Collab Join (E)
      if (e.code === 'KeyE' || e.key?.toLowerCase() === 'e') {
        this.tryJoinCollabEmote();
      }

      // Toggle ShiftLock (ShiftLeft or ShiftRight)
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.shiftLockEnabled = !this.shiftLockEnabled;
        if (this.shiftLockEnabled) {
          const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          if (!isTouch) {
            el.requestPointerLock?.();
          }
        } else {
          document.exitPointerLock?.();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysPressed.delete(e.code);
      if (e.key) {
        this.keysPressed.delete(e.key.toLowerCase());
        this.keysPressed.delete(e.key);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      // Blur any active input field (like chat) so keyboard movement works immediately
      if (document.activeElement && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }

      if (e.button === 2) {
        this.isRightMouseDown = true;
      } else if (e.button === 0) {
        this.handleToolAction();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        this.isRightMouseDown = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }

      // Mouse rotation when right-click dragged or shift-lock active
      if (this.isRightMouseDown || (this.shiftLockEnabled && document.pointerLockElement === el)) {
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;

        this.cameraYaw -= movementX * 0.0035;
        this.cameraPitch = Math.max(-1.2, Math.min(1.4, this.cameraPitch + movementY * 0.0035));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.cameraDistance = Math.max(0.5, Math.min(45, this.cameraDistance + e.deltaY * 0.02));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('wheel', onWheel, { passive: false });
    const activeTouches = new Map<number, { x: number, y: number, startX: number, startY: number, moved: boolean }>();
    const onTouchStart = (e: TouchEvent) => {
      if (document.activeElement && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY, startX: t.clientX, startY: t.clientY, moved: false });
      }
    };
    
    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const last = activeTouches.get(t.identifier);
        if (last) {
          const movementX = t.clientX - last.x;
          const movementY = t.clientY - last.y;
          if (Math.abs(t.clientX - last.startX) > 8 || Math.abs(t.clientY - last.startY) > 8) {
            last.moved = true;
          }
          this.cameraYaw -= movementX * 0.005;
          this.cameraPitch = Math.max(-1.2, Math.min(1.4, this.cameraPitch + movementY * 0.005));
          last.x = t.clientX;
          last.y = t.clientY;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const last = activeTouches.get(t.identifier);
        if (last && !last.moved) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            this.mousePos.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
            this.mousePos.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
            this.handleToolAction();
          }
        }
        activeTouches.delete(t.identifier);
      }
    };
    
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    const onPointerLockChange = () => {
      if (document.pointerLockElement !== el) {
        this.shiftLockEnabled = false;
      }
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    this.cleanups.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    });

    // Handle Window / Container Resize
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.container) return;
      const clientW = this.container.clientWidth || window.innerWidth;
      const clientH = this.container.clientHeight || window.innerHeight;
      if (clientW === 0 || clientH === 0) return;

      const width = clientW * this.resolutionScale;
      const height = clientH * this.resolutionScale;

      this.camera.aspect = clientW / clientH;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    });
    this.resizeObserver.observe(this.container);

    const onWindowResize = () => {
      if (!this.container) return;
      const clientW = this.container.clientWidth || window.innerWidth;
      const clientH = this.container.clientHeight || window.innerHeight;
      if (clientW === 0 || clientH === 0) return;

      const width = clientW * this.resolutionScale;
      const height = clientH * this.resolutionScale;

      this.camera.aspect = clientW / clientH;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    };
    window.addEventListener('resize', onWindowResize);
    this.cleanups.push(() => window.removeEventListener('resize', onWindowResize));
  }

  /**
   * Raycast from mouse or center of screen (in shift-lock)
   */
  private raycastWorld(): { point: THREE.Vector3; normal: THREE.Vector3; partData: PartData | null } | null {
    const raycaster = new THREE.Raycaster();
    
    if (this.shiftLockEnabled && document.pointerLockElement) {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    } else {
      raycaster.setFromCamera(this.mousePos, this.camera);
    }

    const meshes = Array.from(this.partMeshes.values());
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const partId = hit.object.userData?.partId;
      const partData = partId ? this.partsData.get(partId) || null : null;
      const normal = hit.face?.normal ? hit.face.normal.clone().applyQuaternion(hit.object.quaternion) : new THREE.Vector3(0, 1, 0);

      return {
        point: hit.point,
        normal,
        partData,
      };
    }

    return null;
  }

  /**
   * Primary tool click action
   */
  private handleToolAction() {
    const hit = this.raycastWorld();

    switch (this.activeTool) {
      case 'select': {
        if (hit && hit.partData) {
          this.setSelectedPart(hit.partData);
        } else {
          this.setSelectedPart(null);
        }
        break;
      }

      case 'build': {
        if (hit) {
          // Snap position to stud grid
          const snap = this.gridSnap;
          const [sx, sy, sz] = this.buildSize;
          
          // Place slightly offset along normal to stack properly on top of studs!
          const targetPos = hit.point.clone().add(hit.normal.clone().multiplyScalar(sy / 2));
          const snappedX = Math.round(targetPos.x / snap) * snap;
          const snappedY = Math.max(sy / 2, Math.round(targetPos.y / 0.5) * 0.5);
          const snappedZ = Math.round(targetPos.z / snap) * snap;

          const newPart: PartData = {
            id: `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: `${this.buildShape.toUpperCase()}_${this.buildColor}`,
            shape: this.buildShape,
            position: [snappedX, snappedY, snappedZ],
            size: [sx, sy, sz],
            rotation: [0, this.buildRotationAngle, 0],
            color: this.buildColor,
            material: this.buildMaterial,
            surfaceType: this.buildSurfaceType,
            anchored: this.buildAnchored,
            canCollide: true,
            transparency: this.buildMaterial === 'glass' ? 0.5 : 0,
            reflectance: this.buildMaterial === 'metal' ? 0.6 : 0,
            ownerId: this.myPlayerId,
          };

          this.addPart(newPart, true);
          this.score += 10;
          this.callbacks.onPlayerStatsChange(this.health, this.maxHealth, this.score);
        }
        break;
      }

      case 'gravity': {
        if (this.physics.heldBodyId) {
          // Throw held body with camera direction
          const camDir = new THREE.Vector3();
          this.camera.getWorldDirection(camDir);
          this.physics.throwHeldBody(camDir, 75);
        } else if (hit && hit.partData) {
          if (!hit.partData.anchored) {
            this.physics.toggleGrabBody(hit.partData.id, 8);
          } else {
            // Unanchor it if clicked with gravity gun!
            hit.partData.anchored = false;
            this.updatePart(hit.partData, true);
            this.physics.toggleGrabBody(hit.partData.id, 8);
          }
        }
        break;
      }

      case 'rocket': {
        sounds.playRocketLaunch();
        const spawnPos = this.localAvatar.rootGroup.position.clone().add(new THREE.Vector3(0, 2.5, 0));
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);

        const rocketId = `rocket_${Date.now()}`;
        const projectile: Projectile = {
          id: rocketId,
          type: 'rocket',
          position: [spawnPos.x, spawnPos.y, spawnPos.z],
          velocity: [camDir.x * 65, camDir.y * 65, camDir.z * 65],
          shooterId: this.myPlayerId,
          lifetime: 4.0,
        };

        this.projectiles.push(projectile);
        this.createRocketMesh(projectile);
        network.broadcastRocket([spawnPos.x, spawnPos.y, spawnPos.z], [camDir.x, camDir.y, camDir.z]);
        break;
      }

      case 'sword': {
        this.currentAnim = 'sword_slash';
        this.animTimer = 0.45;
        sounds.playSwordSlash();

        // Check if hitting dynamic parts or other avatars in front
        const charPos = this.localAvatar.rootGroup.position;
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);

        // Hit remote players
        this.remotePlayers.forEach((avatar, peerId) => {
          const remotePos = avatar.rootGroup.position;
          if (charPos.distanceTo(remotePos) < 5.5) {
            sounds.playSwordClank();
            // Send damage over P2P network to them (25 damage)
            network.broadcastDamageTaken(peerId, 25);
            this.displayChatBubble(`Struck ${network.peerNames.get(peerId) || 'Player'}!`);
          }
        });

        // Hit dynamic objects and Dummies
        this.physics.bodies.forEach((body, partId) => {
          if (body.type === CANNON.Body.DYNAMIC || partId.startsWith('dummy_')) {
            const bodyPos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
            if (charPos.distanceTo(bodyPos) < 5.5) {
              sounds.playSwordClank();
              const impulse: [number, number, number] = [camDir.x * 35, 15, camDir.z * 35];
              this.physics.applyBodyImpulse(partId, impulse);
              network.broadcastPhysicsImpulse(partId, impulse);

              // If it's a dummy part, deal damage to it (25 HP)
              const part = this.partsData.get(partId);
              if (part && part.shape === 'dummy') {
                const currentHP = part.health !== undefined ? part.health : 100;
                const newHP = Math.max(0, currentHP - 25);
                part.health = newHP;
                
                // Redraw dummy's overhead health label
                this.updateDummyVisualHP(partId, newHP);
                
                // Broadcast updated dummy state
                this.updatePart(part, true);
                
                // Destroy with blocky parts if dead
                if (newHP <= 0) {
                  this.destroyDummyWithDebris(partId);
                }
              }
            }
          }
        });
        break;
      }

      case 'paint': {
        if (hit && hit.partData) {
          hit.partData.color = this.buildColor;
          hit.partData.surfaceType = this.buildSurfaceType;
          hit.partData.material = this.buildMaterial;
          this.updatePart(hit.partData, true);
          sounds.playPaint();
        }
        break;
      }

      case 'push': {
        sounds.playPhysicsThud(0.7);
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);

        if (hit && hit.partData && !hit.partData.anchored) {
          const impulse: [number, number, number] = [camDir.x * 50, 10, camDir.z * 50];
          this.physics.applyBodyImpulse(hit.partData.id, impulse);
          network.broadcastPhysicsImpulse(hit.partData.id, impulse);
        }
        break;
      }

      case 'delete': {
        if (hit && hit.partData) {
          // Do not delete spawn if only 1 exists
          this.removePart(hit.partData.id, true);
        }
        break;
      }
    }
  }

  private createRocketMesh(proj: Projectile) {
    const group = new THREE.Group();
    
    // Green rocket body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.3 })
    );
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Red nosecone
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xe74c3c })
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = 0.7;
    group.add(nose);

    // Glowing flame
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    flame.position.z = -0.7;
    group.add(flame);

    group.position.set(proj.position[0], proj.position[1], proj.position[2]);
    this.scene.add(group);
    this.projectileMeshes.set(proj.id, group as any);
  }

  private triggerExplosion(pos: [number, number, number], radius: number = 18, maxForce: number = 850) {
    this.physics.applyExplosion(pos, radius, maxForce);
    network.broadcastExplosion(pos, radius, maxForce);

    // Deal splash damage to local player if in range
    const charPos = this.localAvatar.rootGroup.position;
    const explosionPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
    const dist = charPos.distanceTo(explosionPos);
    if (dist < radius) {
      const damage = Math.round((1 - (dist / radius)) * 60);
      if (damage > 0) {
        this.damagePlayer(damage);
        this.displayChatBubble("Ouch! Explosion splash damage!");
      }
    }

    // Deal explosion damage to built dummies
    this.partsData.forEach((part, partId) => {
      if (part.shape === 'dummy') {
        const dummyPos = new THREE.Vector3(part.position[0], part.position[1], part.position[2]);
        const d = explosionPos.distanceTo(dummyPos);
        if (d < radius) {
          const dmg = Math.round((1 - (d / radius)) * 75);
          if (dmg > 0) {
            const currentHP = part.health !== undefined ? part.health : 100;
            const newHP = Math.max(0, currentHP - dmg);
            part.health = newHP;
            
            // Re-draw dummy overhead visual health
            this.updateDummyVisualHP(partId, newHP);
            this.updatePart(part, true);
            
            if (newHP <= 0) {
              this.destroyDummyWithDebris(partId);
            }
          }
        }
      }
    });

    // Create explosion particle sparks
    for (let i = 0; i < 24; i++) {
      const spark = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xff4400 : 0xffcc00 })
      );
      spark.position.set(pos[0], pos[1] + 0.5, pos[2]);
      this.particleGroup.add(spark);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        Math.random() * 25 + 5,
        (Math.random() - 0.5) * 30
      );

      const startTime = performance.now();
      const animateSpark = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        if (elapsed > 0.8) {
          this.particleGroup.remove(spark);
          spark.geometry.dispose();
          return;
        }
        spark.position.addScaledVector(vel, 0.016);
        spark.scale.multiplyScalar(0.94);
        requestAnimationFrame(animateSpark);
      };
      animateSpark();
    }
  }

  private updateDummyVisualHP(partId: string, currentHP: number) {
    const mesh = this.partMeshes.get(partId);
    const part = this.partsData.get(partId);
    if (mesh && part) {
      const maxHP = part.maxHealth !== undefined ? part.maxHealth : 100;
      const hpSprite = mesh.getObjectByName('healthTag') as THREE.Sprite;
      if (hpSprite && hpSprite.material.map) {
        const canvasHP = document.createElement('canvas');
        canvasHP.width = 128;
        canvasHP.height = 32;
        const ctxHP = canvasHP.getContext('2d');
        if (ctxHP) {
          ctxHP.fillStyle = 'rgba(0,0,0,0.6)';
          ctxHP.fillRect(0, 0, 128, 32);
          ctxHP.fillStyle = '#ef4444';
          ctxHP.fillRect(4, 4, 120, 24);
          ctxHP.fillStyle = '#10b981';
          ctxHP.fillRect(4, 4, Math.max(0, (currentHP / maxHP) * 120), 24);
          
          ctxHP.fillStyle = '#ffffff';
          ctxHP.font = 'bold 12px sans-serif';
          ctxHP.textAlign = 'center';
          ctxHP.fillText(part.name || 'Dummy', 64, 20);
        }
        const newTex = new THREE.CanvasTexture(canvasHP);
        hpSprite.material.map.dispose();
        hpSprite.material.map = newTex;
        hpSprite.material.needsUpdate = true;
      }
    }
  }

  private destroyDummyWithDebris(partId: string) {
    const part = this.partsData.get(partId);
    if (!part) return;

    sounds.playExplosion();
    const pos = part.position;

    // Spawn 8 pieces of yellow and green plastic debris for blocky Robloxian pieces!
    for (let i = 0; i < 8; i++) {
      const debrisShape: PartShape = Math.random() > 0.5 ? 'block' : 'sphere';
      const debrisPart: PartData = {
        id: `dummy_debris_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: 'Debris',
        shape: debrisShape,
        color: i % 2 === 0 ? '#f5dc3d' : '#3d7a3d', // yellow and green head/leg debris!
        material: 'plastic',
        surfaceType: 'smooth',
        position: [pos[0] + (Math.random() - 0.5) * 2, pos[1] + 1 + (Math.random() - 0.5) * 2, pos[2] + (Math.random() - 0.5) * 2],
        size: [0.8, 0.8, 0.8],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        anchored: false,
        canCollide: true,
        transparency: 0,
        reflectance: 0.1,
      };
      this.addPart(debrisPart, true);
      
      // Apply a small pop-out force/velocity so they scatter beautifully!
      const force: [number, number, number] = [
        (Math.random() - 0.5) * 15,
        Math.random() * 20 + 5,
        (Math.random() - 0.5) * 15
      ];
      setTimeout(() => {
        this.physics.applyBodyImpulse(debrisPart.id, force);
        network.broadcastPhysicsImpulse(debrisPart.id, force);
      }, 50);

      // Automatically clean up debris after 5 seconds
      setTimeout(() => {
        this.removePart(debrisPart.id, true);
      }, 5000);
    }

    // Remove the dummy
    this.removePart(partId, true);
  }

  private setupNetworkHandlers() {
    network.onRequestMapSync = () => {
      return Array.from(this.partsData.values());
    };

    network.onFullMapReceived = (parts) => {
      this.partMeshes.forEach((mesh) => this.scene.remove(mesh));
      this.partMeshes.clear();
      this.partsData.clear();
      parts.forEach((p) => this.addPart(p, false));
    };

    network.onPartAdded = (part) => this.addPart(part, false);
    network.onPartRemoved = (partId) => this.removePart(partId, false);
    network.onPartUpdated = (part) => this.updatePart(part, false);

    network.onPlayerDamaged = (data) => {
      if (data.targetPeerId === network.myPeerId) {
        this.damagePlayer(data.amount);
      }
    };

    network.onCollabRequest = (data) => {
      const avatar = this.remotePlayers.get(data.senderId);
      if (avatar) {
        const labelMap: Record<string, string> = {
          highfive: '✋ HIGH FIVE ME!',
          hug: '🫂 DUO HUG!',
          rps: '✊ ROCK PAPER SCISSORS!',
          duodance: '💃 DUO DANCE!',
          carry: '🎒 PIGGYBACK RIDE!',
        };
        avatar.showCollabPrompt(labelMap[data.emote] || '🤝 COLLAB EMOTE!', 'Press [E] nearby to join!');
        this.displayChatBubble(`${data.senderName} initiated ${data.emote}! Press [E] nearby!`);
      }
    };

    network.onCollabAccept = (data) => {
      const initAvatar = this.remotePlayers.get(data.initiatorId);
      if (initAvatar) initAvatar.clearCollabPrompt();

      if (data.initiatorId === network.myPeerId) {
        this.performCollabSequence(data.emote as CollabEmoteType, data.partnerId, true, data.rpsChoice);
      } else if (data.partnerId === network.myPeerId) {
        this.performCollabSequence(data.emote as CollabEmoteType, data.initiatorId, false, data.rpsChoice);
      }
    };

    network.onCollabCancel = (data) => {
      const avatar = this.remotePlayers.get(data.senderId);
      if (avatar) avatar.clearCollabPrompt();
    };

    network.onPlayerStateReceived = (peerId, state) => {
      let avatar = this.remotePlayers.get(peerId);
      if (!avatar && state.avatar) {
        console.log('Spawning remote player avatar for:', peerId, state.name);
        avatar = new AvatarRig(state.name || 'Player', state.avatar);
        this.remotePlayers.set(peerId, avatar);
        this.scene.add(avatar.rootGroup);
      }

      if (avatar && state.position && state.rotation) {
        avatar.setPositionAndRotation(state.position, state.rotation[1]);
        if (state.animState) {
          (avatar as any).targetAnimState = state.animState;
          (avatar as any).targetHorizSpeed = state.velocity ? Math.sqrt(state.velocity[0]*state.velocity[0] + state.velocity[2]*state.velocity[2]) : 2;
        }
        if (state.equippedTool) {
          avatar.setEquippedTool(state.equippedTool);
        }
        if (state.health !== undefined && state.maxHealth !== undefined) {
          avatar.updateNameTag(state.name || 'Player', state.health, state.maxHealth);
        }
      }
    };

    // Handled in App.tsx -> engine.handlePeerDisconnect
  }

  public handlePeerDisconnect(peerId: string) {
    const avatar = this.remotePlayers.get(peerId);
    if (avatar) {
      this.scene.remove(avatar.rootGroup);
      this.remotePlayers.delete(peerId);
    }


    network.onRocketFired = (data) => {
      const proj: Projectile = {
        id: `remoteverlex_rocket_${Date.now()}`,
        type: 'rocket',
        position: data.pos,
        velocity: [data.dir[0] * 65, data.dir[1] * 65, data.dir[2] * 65],
        shooterId: data.shooterId,
        lifetime: 4.0,
      };
      this.projectiles.push(proj);
      this.createRocketMesh(proj);
    };

    network.onExplosionTriggered = (data) => {
      this.physics.applyExplosion(data.pos, data.radius, data.force);
    };

    network.onPhysicsImpulseReceived = (data) => {
      this.physics.applyBodyImpulse(data.partId, data.impulse);
    };
  }

  /**
   * Main Render and Physics Animation Loop
   */
  private animate(time: number) {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // Tick respawn countdown if player is dead
    if (this.isDead) {
      this.respawnTimer = Math.max(0, this.respawnTimer - delta);
      if (this.respawnTimer <= 0) {
        this.isDead = false;
        this.respawnPlayer();
      }
    }

    // 1. Process Character Movement & Newtonian Controls
    this.updateCharacterMovement(delta);

    // 2. Step Newtonian Physics World
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    this.physics.step(delta, this.camera.position, camDir);

    // 3. Sync Dynamic Physics Parts from Cannon-es to Three.js Meshes
    this.syncPhysicsMeshes();

    // 4. Update Ballistic Projectiles (Rockets)
    this.updateProjectiles(delta);

    // 5. Update Camera Orbit / Follow
    this.updateCamera(delta);

    // 6. Smooth Remote Player Animations & Collab Rider Attachments
    this.remotePlayers.forEach((avatar, peerId) => {
      const targetState = (avatar as any).targetAnimState || 'idle';

      // If remote player is riding another remote player, attach rider to carrier's back
      if (targetState === 'carry_rider') {
        let carrierAvatar: AvatarRig | null = null;
        this.remotePlayers.forEach((otherAvatar, otherPeerId) => {
          if (otherPeerId !== peerId && (otherAvatar as any).targetAnimState === 'carry_base') {
            carrierAvatar = otherAvatar;
          }
        });

        if (carrierAvatar) {
          const cPos = (carrierAvatar as AvatarRig).rootGroup.position;
          const cYaw = (carrierAvatar as AvatarRig).rootGroup.rotation.y;
          const backX = cPos.x - Math.sin(cYaw) * 0.35;
          const backZ = cPos.z - Math.cos(cYaw) * 0.35;
          const backY = cPos.y + 1.25;
          avatar.setPositionAndRotation([backX, backY, backZ], cYaw);
        }
      }

      avatar.updateAnimation(delta, targetState, (avatar as any).targetHorizSpeed || 0);
    });

    // Handle Active Local Collab Partner Attachment
    if (this.activeCollabEmote && this.activeCollabPartnerId && this.animTimer > 0) {
      const partnerAvatar = this.activeCollabPartnerId === 'bot'
        ? this.botCompanionAvatar
        : this.remotePlayers.get(this.activeCollabPartnerId);

      if (this.activeCollabEmote === 'carry') {
        if (this.currentAnim === 'carry_rider') {
          // Local player is riding carrier partner
          if (partnerAvatar) {
            const cPos = partnerAvatar.rootGroup.position;
            const cYaw = partnerAvatar.rootGroup.rotation.y;
            const backX = cPos.x - Math.sin(cYaw) * 0.35;
            const backZ = cPos.z - Math.cos(cYaw) * 0.35;
            const backY = cPos.y + 2.1 + 1.25;
            this.physics.characterBody.position.set(backX, backY, backZ);
            this.physics.characterBody.velocity.set(0, 0, 0);
            this.localAvatar.rootGroup.rotation.y = cYaw;
          }
        } else if (this.currentAnim === 'carry_base') {
          // Local player is carrying rider partner
          if (partnerAvatar) {
            const myPos = this.physics.characterBody.position;
            const myYaw = this.localAvatar.rootGroup.rotation.y;
            const backX = myPos.x - Math.sin(myYaw) * 0.35;
            const backZ = myPos.z - Math.cos(myYaw) * 0.35;
            const backY = myPos.y + 1.25;
            partnerAvatar.setPositionAndRotation([backX, backY - 2.1, backZ], myYaw);
            (partnerAvatar as any).targetAnimState = 'carry_rider';
          }
        }
      } else if (partnerAvatar) {
        // Highfive, hug, rps, duodance alignment
        const myPos = this.physics.characterBody.position;
        const myYaw = this.localAvatar.rootGroup.rotation.y;
        let dist = 1.35;
        let rotOffset = Math.PI;
        let isSide = false;

        if (this.activeCollabEmote === 'hug') dist = 0.9;
        else if (this.activeCollabEmote === 'rps') dist = 1.5;
        else if (this.activeCollabEmote === 'duodance') { isSide = true; dist = 1.3; rotOffset = 0; }

        let px = myPos.x - Math.sin(myYaw) * dist;
        let pz = myPos.z - Math.cos(myYaw) * dist;
        if (isSide) {
          px = myPos.x + Math.cos(myYaw) * dist;
          pz = myPos.z - Math.sin(myYaw) * dist;
        }

        partnerAvatar.setPositionAndRotation([px, myPos.y - 2.1, pz], myYaw + rotOffset);
      }
    }

    // 6. Update Ghost Build Preview
    this.updateGhostMesh();

    // 7. Update Gravity Beam Visual
    this.updateGravityBeam();

    // 8. Update Local Avatar Animations
    this.updateAvatarVisuals(delta);

    // 9. Sync P2P Network (at ~20 Hz)
    this.networkSyncTimer += delta;
    if (this.networkSyncTimer >= 0.05) {
      this.networkSyncTimer = 0;
      this.syncLocalPlayerToNetwork();
    }

    // 10. Check Fall into Void
    if (this.physics.characterBody.position.y < -35 && !this.isDead) {
      sounds.playOof();
      this.damagePlayer(100);
    }

    // 11. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);
  }

  private updateCharacterMovement(delta: number) {
    if (this.isDead) {
      this.physics.characterBody.velocity.set(0, 0, 0);
      this.physics.characterBody.angularVelocity.set(0, 0, 0);
      return;
    }
    const body = this.physics.characterBody;
    body.wakeUp(); // Ensure physics body is active

    const moveSpeed = 22; // studs per second

    // Forward & Right vectors from Camera Yaw
    const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw)).normalize();

    const isForward = this.keysPressed.has('KeyW') || this.keysPressed.has('w') || this.keysPressed.has('W') || this.keysPressed.has('ArrowUp');
    const isBackward = this.keysPressed.has('KeyS') || this.keysPressed.has('s') || this.keysPressed.has('S') || this.keysPressed.has('ArrowDown');
    const isLeft = this.keysPressed.has('KeyA') || this.keysPressed.has('a') || this.keysPressed.has('A');
    const isRight = this.keysPressed.has('KeyD') || this.keysPressed.has('d') || this.keysPressed.has('D');
    const isJump = this.keysPressed.has('Space') || this.keysPressed.has(' ') || this.virtualJumpPressed;

    const inputMove = new THREE.Vector3();
    if (isForward) inputMove.add(forward);
    if (isBackward) inputMove.sub(forward);
    if (isLeft) inputMove.sub(right);
    if (isRight) inputMove.add(right);
    
    // Add analog joystick input
    if (Math.abs(this.virtualJoystickMove.y) > 0.05) {
      inputMove.addScaledVector(forward, this.virtualJoystickMove.y);
    }
    if (Math.abs(this.virtualJoystickMove.x) > 0.05) {
      inputMove.addScaledVector(right, this.virtualJoystickMove.x);
    }

    const isMoving = inputMove.lengthSq() > 0.01;
    if (isMoving) {
      if (inputMove.lengthSq() > 1) inputMove.normalize();
    }

    // Check if character is on ground via raycast in Cannon world
    const rayFrom = new CANNON.Vec3(body.position.x, body.position.y - 1.0, body.position.z);
    const rayTo = new CANNON.Vec3(body.position.x, body.position.y - 2.35, body.position.z);
    const result = new CANNON.RaycastResult();
    
    this.physics.world.rayTest(rayFrom, rayTo, result);
    this.isGrounded = (result.hasHit && result.body !== body) || Math.abs(body.velocity.y) < 0.15;

    // Check trampoline & conveyor interactions under feet
    const bodyUserData = (result.body as any)?.userData;
    if (this.isGrounded && bodyUserData?.partData) {
      const partUnder: PartData = bodyUserData.partData;
      if (partUnder.shape === 'trampoline') {
        body.velocity.y = 36; // super bounce
        sounds.playTrampoline();
      } else if (partUnder.shape === 'conveyor') {
        body.velocity.z += 12; // conveyor push
      } else if (partUnder.material === 'neon' && partUnder.color === '#e74c3c') {
        // Red kill-brick / lava
        this.damagePlayer(1);
      }
    }

    // Jump
    if (isJump && this.isGrounded) {
      body.velocity.y = 22; // responsive Verlex jump
      sounds.playJump();
      this.isGrounded = false;
    }

    // Apply horizontal velocity smoothly
    if (isMoving) {
      body.velocity.x = inputMove.x * moveSpeed;
      body.velocity.z = inputMove.z * moveSpeed;
    } else if (this.isGrounded) {
      body.velocity.x *= 0.65;
      body.velocity.z *= 0.65;
      if (Math.abs(body.velocity.x) < 0.05) body.velocity.x = 0;
      if (Math.abs(body.velocity.z) < 0.05) body.velocity.z = 0;
    }

    // Determine Animation State
    const isCarryEmote = this.currentAnim === 'carry_base' || this.currentAnim === 'carry_rider';
    if (isMoving && !isCarryEmote) {
      this.animTimer = 0;
    }

    if (this.animTimer > 0) {
      this.animTimer -= delta;
      if (this.animTimer <= 0) {
        this.activeCollabPartnerId = null;
        this.activeCollabRole = null;
        this.activeCollabEmote = null;
      }
    } else {
      this.activeCollabPartnerId = null;
      this.activeCollabRole = null;
      this.activeCollabEmote = null;
      if (!this.isGrounded) {
        this.currentAnim = body.velocity.y > 0 ? 'jump' : 'fall';
      } else if (isMoving) {
        this.currentAnim = 'walk';
      } else {
        this.currentAnim = 'idle';
      }
    }
  }

  private syncPhysicsMeshes() {
    const partsToVoidRemove: string[] = [];

    this.physics.bodies.forEach((body, partId) => {
      const mesh = this.partMeshes.get(partId);
      if (mesh && body.type === CANNON.Body.DYNAMIC) {
        // Void fall check for dynamic parts to prevent infinite acceleration performance lag
        if (body.position.y < -40) {
          partsToVoidRemove.push(partId);
          return;
        }

        mesh.position.set(body.position.x, body.position.y, body.position.z);
        mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);

        // Keep PartData position up to date
        const part = this.partsData.get(partId);
        if (part) {
          part.position = [body.position.x, body.position.y, body.position.z];
        }
      }
    });

    // Cleanly delete the voided parts and sync deletion with network peers
    partsToVoidRemove.forEach((partId) => {
      this.removePart(partId, true);
    });

    if (this.selectionBox && this.selectedPartId) {
      this.selectionBox.update();
    }
  }

  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.lifetime -= delta;

      const mesh = this.projectileMeshes.get(proj.id);
      if (mesh) {
        // Move along velocity vector
        mesh.position.x += proj.velocity[0] * delta;
        mesh.position.y += proj.velocity[1] * delta;
        mesh.position.z += proj.velocity[2] * delta;
        proj.position = [mesh.position.x, mesh.position.y, mesh.position.z];

        // Orient rocket mesh along flight direction
        const velVec = new THREE.Vector3(proj.velocity[0], proj.velocity[1], proj.velocity[2]);
        mesh.lookAt(mesh.position.clone().add(velVec));

        // Check collision against world parts
        const raycaster = new THREE.Raycaster(
          mesh.position,
          velVec.clone().normalize(),
          0,
          velVec.length() * delta * 1.5
        );
        const meshes = Array.from(this.partMeshes.values());
        const hits = raycaster.intersectObjects(meshes, false);

        if (hits.length > 0 || proj.lifetime <= 0 || mesh.position.y < -10) {
          // Detonate!
          this.triggerExplosion(proj.position, 18, 850);
          this.scene.remove(mesh);
          this.projectileMeshes.delete(proj.id);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private updateCamera(delta: number = 0.016) {
    // Arrow Left / Right, Q / E, and < / > turn camera smoothly
    const camTurnSpeed = 2.8; // radians per second
    const isTurnLeft = (
      this.keysPressed.has('ArrowLeft') ||
      this.keysPressed.has('arrowleft') ||
      this.keysPressed.has('Left') ||
      this.keysPressed.has('KeyQ') ||
      this.keysPressed.has('q') ||
      this.keysPressed.has('Comma') ||
      this.keysPressed.has('<') ||
      this.keysPressed.has(',')
    );

    const isTurnRight = (
      this.keysPressed.has('ArrowRight') ||
      this.keysPressed.has('arrowright') ||
      this.keysPressed.has('Right') ||
      this.keysPressed.has('KeyE') ||
      this.keysPressed.has('e') ||
      this.keysPressed.has('Period') ||
      this.keysPressed.has('>') ||
      this.keysPressed.has('.')
    );

    if (isTurnLeft) {
      this.cameraYaw += camTurnSpeed * delta;
    }
    if (isTurnRight) {
      this.cameraYaw -= camTurnSpeed * delta;
    }

    const charPos = this.physics.characterBody.position;
    const target = this.isDead 
      ? new THREE.Vector3(this.deathPos.x, this.deathPos.y + 1.2, this.deathPos.z)
      : new THREE.Vector3(charPos.x, charPos.y + 1.2, charPos.z);

    // Calculate spherical orbit position
    const radius = this.cameraDistance;
    const x = target.x + radius * Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch);
    const y = target.y + radius * Math.sin(this.cameraPitch);
    const z = target.z + radius * Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(target);
  }

  private updateGhostMesh() {
    if (!this.ghostMesh || this.activeTool !== 'build') {
      if (this.ghostMesh) this.ghostMesh.visible = false;
      return;
    }

    const hit = this.raycastWorld();
    if (hit) {
      const snap = this.gridSnap;
      const [sx, sy, sz] = this.buildSize;
      const targetPos = hit.point.clone().add(hit.normal.clone().multiplyScalar(sy / 2));
      const snappedX = Math.round(targetPos.x / snap) * snap;
      const snappedY = Math.max(sy / 2, Math.round(targetPos.y / 0.5) * 0.5);
      const snappedZ = Math.round(targetPos.z / snap) * snap;

      this.ghostMesh.position.set(snappedX, snappedY, snappedZ);
      this.ghostMesh.rotation.y = this.buildRotationAngle;
      this.ghostMesh.scale.set(sx / 4, sy / 2, sz / 4);
      this.ghostMesh.visible = true;
    } else {
      this.ghostMesh.visible = false;
    }
  }

  private updateGravityBeam() {
    if (!this.gravityBeamLine) return;

    if (this.physics.heldBodyId && this.activeTool === 'gravity') {
      const body = this.physics.bodies.get(this.physics.heldBodyId);
      if (body) {
        const start = this.localAvatar.rootGroup.position.clone().add(new THREE.Vector3(0.6, 2.0, 0.4));
        const end = new THREE.Vector3(body.position.x, body.position.y, body.position.z);

        const geo = this.gravityBeamLine.geometry as THREE.BufferGeometry;
        geo.setFromPoints([start, end]);
        this.gravityBeamLine.visible = true;
        return;
      }
    }

    this.gravityBeamLine.visible = false;
  }

  private updateAvatarVisuals(delta: number) {
    if (this.isDead) {
      this.localAvatar.rootGroup.visible = false;
      return;
    }
    const charPos = this.physics.characterBody.position;
    
    // Character rotation: in ShiftLock faces camera direction, otherwise faces movement direction
    let targetRotY = this.localAvatar.rootGroup.rotation.y;
    const bodyVel = this.physics.characterBody.velocity;
    const horizSpeed = Math.sqrt(bodyVel.x * bodyVel.x + bodyVel.z * bodyVel.z);

    if (this.shiftLockEnabled) {
      targetRotY = this.cameraYaw + Math.PI;
    } else if (horizSpeed > 1.0) {
      targetRotY = Math.atan2(bodyVel.x, bodyVel.z);
    }

    this.localAvatar.setPositionAndRotation([charPos.x, charPos.y - 2.1, charPos.z], targetRotY);
    this.localAvatar.updateAnimation(delta, this.currentAnim, horizSpeed);
  }

  private syncLocalPlayerToNetwork() {
    const charPos = this.physics.characterBody.position;
    const syncedPos: [number, number, number] = this.isDead 
      ? [this.deathPos.x, -500, this.deathPos.z]
      : [charPos.x, charPos.y - 2.1, charPos.z];

    const state: Partial<PlayerState> = {
      name: this.playerName,
      avatar: this.avatarConfig,
      position: syncedPos,
      rotation: [0, this.localAvatar.rootGroup.rotation.y, 0],
      velocity: this.isDead ? [0, 0, 0] : [
        this.physics.characterBody.velocity.x,
        this.physics.characterBody.velocity.y,
        this.physics.characterBody.velocity.z,
      ],
      animState: this.isDead ? 'idle' : this.currentAnim,
      equippedTool: this.activeTool,
      health: this.health,
      maxHealth: this.maxHealth,
      score: this.score,
    };

    network.syncPlayerState(state);
  }

  public destroy() {
    // Explicitly release any browser pointer lock to keep normal page buttons clickable
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock?.();
      } catch (err) {
        console.warn('Failed to exit pointer lock during destroy:', err);
      }
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups = [];

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
    network.cleanup();
  }
}
