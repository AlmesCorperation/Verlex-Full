import * as THREE from 'three';
import { AnimState, AvatarConfig, AvatarHat, ToolType } from '../types';
import { MeshFactory } from './meshFactory';
import { textureFactory } from './studTextures';

export class AvatarRig {
  public rootGroup: THREE.Group;
  private lastName: string = '';
  private lastHealth: number = -1;
  private lastMaxHealth: number = -1;
  public headGroup: THREE.Group;
  public torsoMesh: THREE.Mesh;
  public leftArmGroup: THREE.Group;
  public rightArmGroup: THREE.Group;
  public leftLegGroup: THREE.Group;
  public rightLegGroup: THREE.Group;
  public leftArmMesh: THREE.Mesh;
  public rightArmMesh: THREE.Mesh;
  public leftLegMesh: THREE.Mesh;
  public rightLegMesh: THREE.Mesh;
  public headMesh: THREE.Group;
  public hatGroup: THREE.Group;
  public toolHolder: THREE.Group;
  public currentToolMesh: THREE.Group | null = null;
  public nameTagSprite: THREE.Sprite | null = null;
  public tshirtMesh: THREE.Mesh | null = null;

  private currentAnim: AnimState = 'idle';
  private animTime: number = 0;
  private currentEquippedTool: ToolType = 'select';
  private config: AvatarConfig;

  constructor(name: string, config: AvatarConfig) {
    this.config = config;
    this.rootGroup = new THREE.Group();

    // Standard Verlex R6 Proportions:
    // Torso: 2x2x1 studs
    // Head: 1.25x1.25x1.25 studs (with cylinder/bevel profile and top stud)
    // Arms: 1x2x1 studs
    // Legs: 1x2x1 studs

    // --- Torso ---
    const torsoGeo = new THREE.BoxGeometry(2, 2, 1);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.torsoColor),
      roughness: 0.35,
      metalness: 0.05,
    });
    this.torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    this.torsoMesh.position.y = 2.0; // center of torso at y=2
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.rootGroup.add(this.torsoMesh);

    // Shoulder Studs (2 on left, 2 on right)
    const studGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12);
    const studMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.torsoColor),
      roughness: 0.35,
    });

    const studPositions = [
      [-0.5, 1.06, -0.22],
      [-0.5, 1.06, 0.22],
      [0.5, 1.06, -0.22],
      [0.5, 1.06, 0.22],
    ];
    for (const [sx, sy, sz] of studPositions) {
      const stud = new THREE.Mesh(studGeo, studMat);
      stud.position.set(sx, sy, sz);
      stud.castShadow = true;
      this.torsoMesh.add(stud);
    }

    // T-Shirt Decal on Torso Front
    const tshirtGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const tshirtTex = textureFactory.getAvatarTShirtTexture(config.tshirt || 'verlex_r');
    const tshirtMat = new THREE.MeshBasicMaterial({
      map: tshirtTex,
      transparent: true,
      depthWrite: false,
    });
    this.tshirtMesh = new THREE.Mesh(tshirtGeo, tshirtMat);
    this.tshirtMesh.position.set(0, 0.05, 0.505);
    this.torsoMesh.add(this.tshirtMesh);

    // --- Head Group & Mesh ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.45, 0); // on top of torso
    this.torsoMesh.add(this.headGroup);

    this.headMesh = new THREE.Group();
    this.buildHead();
    this.headGroup.add(this.headMesh);

    // Hat Accessory
    this.hatGroup = new THREE.Group();
    this.hatGroup.position.y = 0.65;
    this.headGroup.add(this.hatGroup);
    this.buildHat(config.hat);

    // --- Left Arm (Pivot at shoulder) ---
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-1.5, 0.9, 0);
    this.torsoMesh.add(this.leftArmGroup);

    const leftArmGeo = new THREE.BoxGeometry(1, 2, 1);
    const leftArmMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.leftArmColor),
      roughness: 0.35,
      metalness: 0.05,
    });
    this.leftArmMesh = new THREE.Mesh(leftArmGeo, leftArmMat);
    this.leftArmMesh.position.set(0, -0.9, 0); // offset down from shoulder pivot
    this.leftArmMesh.castShadow = true;
    this.leftArmGroup.add(this.leftArmMesh);

    // --- Right Arm (Pivot at shoulder) ---
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(1.5, 0.9, 0);
    this.torsoMesh.add(this.rightArmGroup);

    const rightArmGeo = new THREE.BoxGeometry(1, 2, 1);
    const rightArmMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.rightArmColor),
      roughness: 0.35,
      metalness: 0.05,
    });
    this.rightArmMesh = new THREE.Mesh(rightArmGeo, rightArmMat);
    this.rightArmMesh.position.set(0, -0.9, 0); // offset down from shoulder pivot
    this.rightArmMesh.castShadow = true;
    this.rightArmGroup.add(this.rightArmMesh);

    // Tool Holder in right hand
    this.toolHolder = new THREE.Group();
    this.toolHolder.position.set(0, -1.9, 0.6);
    this.rightArmGroup.add(this.toolHolder);

    // --- Left Leg (Pivot at hip) ---
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.5, -1.0, 0);
    this.torsoMesh.add(this.leftLegGroup);

    const leftLegGeo = new THREE.BoxGeometry(1, 2, 1);
    const leftLegMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.leftLegColor),
      roughness: 0.35,
      metalness: 0.05,
    });
    this.leftLegMesh = new THREE.Mesh(leftLegGeo, leftLegMat);
    this.leftLegMesh.position.set(0, -1.0, 0); // offset down from hip
    this.leftLegMesh.castShadow = true;
    this.leftLegGroup.add(this.leftLegMesh);

    // --- Right Leg (Pivot at hip) ---
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.5, -1.0, 0);
    this.torsoMesh.add(this.rightLegGroup);

    const rightLegGeo = new THREE.BoxGeometry(1, 2, 1);
    const rightLegMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.rightLegColor),
      roughness: 0.35,
      metalness: 0.05,
    });
    this.rightLegMesh = new THREE.Mesh(rightLegGeo, rightLegMat);
    this.rightLegMesh.position.set(0, -1.0, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLegGroup.add(this.rightLegMesh);

    // --- Overhead Name Tag ---
    this.updateNameTag(name, 100, 100);
  }

  /**
   * Constructs the Verlex head mesh (cylinder/bevel profile + top connector stud + face decal)
   */
  private buildHead() {
    while (this.headMesh.children.length > 0) {
      this.headMesh.remove(this.headMesh.children[0]);
    }

    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.headColor),
      roughness: 0.35,
      metalness: 0.05,
    });

    // 1. Cylinder Body (rounded Verlex SpecialMesh head)
    const headCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.625, 0.625, 1.15, 24),
      skinMat
    );
    headCylinder.castShadow = true;
    this.headMesh.add(headCylinder);

    // Top and bottom rounded hemisphere caps
    const topCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.625, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      skinMat
    );
    topCap.position.y = 0.575;
    topCap.scale.set(1, 0.22, 1);
    this.headMesh.add(topCap);

    const bottomCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.625, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      skinMat
    );
    bottomCap.position.y = -0.575;
    bottomCap.scale.set(1, 0.22, 1);
    this.headMesh.add(bottomCap);

    // 2. Iconic Top Connector Stud on head
    const headStud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.2, 16),
      skinMat
    );
    headStud.position.y = 0.68;
    headStud.castShadow = true;
    this.headMesh.add(headStud);

    // 3. Face Decal on Front
    const faceTex = textureFactory.getAvatarFaceTexture(this.config.face);
    const faceMat = new THREE.MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      depthWrite: false,
    });
    const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), faceMat);
    faceMesh.position.set(0, 0, 0.632);
    this.headMesh.add(faceMesh);
  }

  public updateConfig(newConfig: Partial<AvatarConfig>) {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.torsoColor) {
      (this.torsoMesh.material as THREE.MeshStandardMaterial).color.set(newConfig.torsoColor);
    }
    if (newConfig.headColor || newConfig.face) {
      this.buildHead();
    }
    if (newConfig.leftArmColor) {
      (this.leftArmMesh.material as THREE.MeshStandardMaterial).color.set(newConfig.leftArmColor);
    }
    if (newConfig.rightArmColor) {
      (this.rightArmMesh.material as THREE.MeshStandardMaterial).color.set(newConfig.rightArmColor);
    }
    if (newConfig.leftLegColor) {
      (this.leftLegMesh.material as THREE.MeshStandardMaterial).color.set(newConfig.leftLegColor);
    }
    if (newConfig.rightLegColor) {
      (this.rightLegMesh.material as THREE.MeshStandardMaterial).color.set(newConfig.rightLegColor);
    }

    // --- Shirt Clothing Overrides ---
    if (newConfig.shirt) {
      const shirtColors: Record<string, string> = {
        red_tuxedo: '#990000',
        verlex_hoodie: '#1a1a24',
        galaxy_suit: '#4b0082',
        cyber_armor: '#005f73',
        denim_jacket: '#2b580c',
        royalty_shirt: '#d4af37',
      };
      if (shirtColors[newConfig.shirt]) {
        (this.torsoMesh.material as THREE.MeshStandardMaterial).color.set(shirtColors[newConfig.shirt]);
        (this.leftArmMesh.material as THREE.MeshStandardMaterial).color.set(shirtColors[newConfig.shirt]);
        (this.rightArmMesh.material as THREE.MeshStandardMaterial).color.set(shirtColors[newConfig.shirt]);
      }
    }

    // --- Pants Clothing Overrides ---
    if (newConfig.pants) {
      const pantsColors: Record<string, string> = {
        blue_jeans: '#1c3144',
        cargo_pants: '#2d3748',
        tuxedo_slacks: '#111111',
        black_joggers: '#1f2937',
        royal_leggings: '#94a3b8',
      };
      if (pantsColors[newConfig.pants]) {
        (this.leftLegMesh.material as THREE.MeshStandardMaterial).color.set(pantsColors[newConfig.pants]);
        (this.rightLegMesh.material as THREE.MeshStandardMaterial).color.set(pantsColors[newConfig.pants]);
      }
    }

    if (newConfig.tshirt && this.tshirtMesh) {
      const tshirtTex = textureFactory.getAvatarTShirtTexture(newConfig.tshirt);
      (this.tshirtMesh.material as THREE.MeshBasicMaterial).map = tshirtTex;
      (this.tshirtMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
    if (newConfig.hat) {
      this.buildHat(newConfig.hat);
    }
  }

  private buildHat(hat: AvatarHat) {
    while (this.hatGroup.children.length > 0) {
      this.hatGroup.remove(this.hatGroup.children[0]);
    }

    if (hat === 'verlex_cap') {
      // Red VERLEX Baseball Cap with White Button & Trim
      const capDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.6 })
      );
      capDome.position.y = 0.05;
      this.hatGroup.add(capDome);

      // Curved Visor Brim
      const brim = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.06, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.6 })
      );
      brim.position.set(0, 0.02, 0.7);
      brim.rotation.x = 0.15;
      this.hatGroup.add(brim);

      // White button top
      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      button.position.y = 0.76;
      this.hatGroup.add(button);
    } else if (hat === 'fedora') {
      // Black Fedora
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 })
      );
      this.hatGroup.add(brim);

      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.8, 0.65, 16),
        new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 })
      );
      crown.position.y = 0.35;
      this.hatGroup.add(crown);

      // Red ribbon band
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.81, 0.81, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0xc0392b })
      );
      band.position.y = 0.12;
      this.hatGroup.add(band);
    } else if (hat === 'domino') {
      // Domino Crown
      const crownBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 0.25, 12),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
      );
      this.hatGroup.add(crownBase);

      // 6 Gold Spikes
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.6, 6),
          new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
        );
        spike.position.set(Math.cos(angle) * 0.7, 0.4, Math.sin(angle) * 0.7);
        this.hatGroup.add(spike);

        // Green Emerald Stud
        const gem = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.1, emissive: 0x0a3d1b })
        );
        gem.position.set(Math.cos(angle) * 0.86, 0.0, Math.sin(angle) * 0.86);
        this.hatGroup.add(gem);
      }
    } else if (hat === 'valkyrie') {
      // Valkyrie Helm
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.74, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.8, roughness: 0.3 })
      );
      this.hatGroup.add(helm);

      // Wing side vanes
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.9, 0.4),
          new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 })
        );
        wing.position.set(side * 0.75, 0.5, 0);
        wing.rotation.z = -side * 0.4;
        wing.rotation.x = -0.3;
        this.hatGroup.add(wing);
      }
    } else if (hat === 'chef') {
      // Chef Toque
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.72, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.9 })
      );
      this.hatGroup.add(brim);

      const puffyTop = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
      );
      puffyTop.position.y = 0.55;
      puffyTop.scale.set(1, 0.75, 1);
      this.hatGroup.add(puffyTop);
    } else if (hat === 'teapot') {
      // Green Teapot Hat
      const potBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.3 })
      );
      potBody.position.y = 0.3;
      potBody.scale.set(1, 0.8, 1);
      this.hatGroup.add(potBody);

      // Spout
      const spout = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.16, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.3 })
      );
      spout.position.set(0.6, 0.35, 0);
      spout.rotation.z = -0.7;
      this.hatGroup.add(spout);

      // Handle
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.3 })
      );
      handle.position.set(-0.6, 0.3, 0);
      handle.rotation.z = Math.PI / 2;
      this.hatGroup.add(handle);
    } else if (hat === 'visor') {
      // Verlex Green Verlex Visor
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.12, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x27ae60, transparent: true, opacity: 0.85 })
      );
      visor.position.set(0, -0.15, 0.45);
      visor.rotation.x = 0.2;
      this.hatGroup.add(visor);
    } else if (hat === 'bandana') {
      // Red Bandana
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 0.35, 1.35),
        new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.7 })
      );
      band.position.y = -0.15;
      this.hatGroup.add(band);
    } else if (hat === 'horns') {
      // Demon / Dragon Horns
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.3 })
        );
        horn.position.set(side * 0.55, 0.4, 0);
        horn.rotation.z = -side * 0.5;
        horn.rotation.x = -0.2;
        this.hatGroup.add(horn);
      }
    } else if (hat === 'blockhead') {
      // Propeller / Beanie Cap
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x3498db, roughness: 0.5 })
      );
      this.hatGroup.add(cap);

      const prop = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.04, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xf1c40f })
      );
      prop.position.y = 0.8;
      this.hatGroup.add(prop);
    }
  }

  public setEquippedTool(tool: ToolType) {
    if (this.currentEquippedTool === tool && this.currentToolMesh) return;
    this.currentEquippedTool = tool;

    while (this.toolHolder.children.length > 0) {
      this.toolHolder.remove(this.toolHolder.children[0]);
    }

    if (tool !== 'select') {
      this.currentToolMesh = MeshFactory.createToolMesh(tool);
      this.toolHolder.add(this.currentToolMesh);
    } else {
      this.currentToolMesh = null;
    }
  }

  private drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  public updateNameTag(name: string, health: number, maxHealth: number, force: boolean = false) {
    if (!force && name === this.lastName && health === this.lastHealth && maxHealth === this.lastMaxHealth) {
      return;
    }
    this.lastName = name;
    this.lastHealth = health;
    this.lastMaxHealth = maxHealth;

    if (this.nameTagSprite) {
      this.rootGroup.remove(this.nameTagSprite);
      this.nameTagSprite.material.dispose();
      this.nameTagSprite = null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 110;
    const ctx = canvas.getContext('2d')!;

    // Name background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    this.drawRoundRect(ctx, 12, 10, 360, 48, 10);
    ctx.fill();

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 192, 34);

    // Health bar container
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.drawRoundRect(ctx, 40, 68, 304, 20, 6);
    ctx.fill();

    // Health bar fill (Green to Red gradient)
    if (healthPercent > 0) {
      ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
      this.drawRoundRect(ctx, 42, 70, Math.max(8, 300 * healthPercent), 16, 4);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    this.nameTagSprite = new THREE.Sprite(spriteMat);
    this.nameTagSprite.scale.set(3.8, 1.1, 1);
    this.nameTagSprite.position.set(0, 5.8, 0);
    this.rootGroup.add(this.nameTagSprite);
  }

  /**
   * Updates limb animations based on movement velocity and animation state
   */
  public updateAnimation(delta: number, state: AnimState, moveSpeed: number = 0) {
    this.currentAnim = state;
    this.animTime += delta;

    // Reset base limb rotations
    this.headGroup.rotation.set(0, 0, 0);
    this.torsoMesh.rotation.set(0, 0, 0);

    const hasTool = this.currentEquippedTool !== 'select';

    if (state === 'walk' || (moveSpeed > 0.5 && state !== 'jump' && state !== 'fall' && state !== 'sword_slash' && state !== 'dance' && state !== 'wave' && state !== 'sit')) {
      const walkFreq = 10;
      const walkAngle = Math.sin(this.animTime * walkFreq) * 0.65;

      // Legs swing in opposite phases
      this.leftLegGroup.rotation.x = walkAngle;
      this.rightLegGroup.rotation.x = -walkAngle;

      // Arms swing
      this.leftArmGroup.rotation.x = -walkAngle;
      this.leftArmGroup.rotation.z = 0.08;

      if (hasTool) {
        // Holding tool: arm stays aimed forward
        this.rightArmGroup.rotation.x = -Math.PI / 2 + Math.sin(this.animTime * walkFreq * 0.5) * 0.05;
        this.rightArmGroup.rotation.z = 0;
      } else {
        this.rightArmGroup.rotation.x = walkAngle;
        this.rightArmGroup.rotation.z = -0.08;
      }

      // Subtle torso bob
      this.torsoMesh.position.y = 3.0 + Math.abs(Math.sin(this.animTime * walkFreq)) * 0.12;
    } else if (state === 'sit') {
      // Sitting Emote: legs rotated 90 deg forward resting flat ON TOP of grass (never clipping through ground)
      const breathe = Math.sin(this.animTime * 2.0) * 0.02;
      this.torsoMesh.position.y = 1.5 + breathe;

      this.leftLegGroup.rotation.set(-Math.PI / 2, 0, 0);
      this.rightLegGroup.rotation.set(-Math.PI / 2, 0, 0);

      this.leftArmGroup.rotation.set(-0.15, 0, 0.12);
      if (hasTool) {
        this.rightArmGroup.rotation.set(-Math.PI / 2, 0, 0);
      } else {
        this.rightArmGroup.rotation.set(-0.15, 0, -0.12);
      }

      this.headGroup.rotation.set(breathe * 0.5, 0, 0);
    } else if (state === 'jump') {
      // jump pose: arms straight up, legs dangling
      this.leftArmGroup.rotation.set(-2.6, 0, -0.3);
      this.rightArmGroup.rotation.set(-2.6, 0, 0.3);
      this.leftLegGroup.rotation.set(0.3, 0, 0);
      this.rightLegGroup.rotation.set(0.3, 0, 0);
      this.torsoMesh.position.y = 3.0;
    } else if (state === 'fall') {
      // Falling pose: arms splayed
      this.leftArmGroup.rotation.set(-1.5, 0, -0.7);
      this.rightArmGroup.rotation.set(-1.5, 0, 0.7);
      this.leftLegGroup.rotation.set(-0.2, 0, -0.2);
      this.rightLegGroup.rotation.set(-0.2, 0, 0.2);
      this.torsoMesh.position.y = 3.0;
    } else if (state === 'sword_slash') {
      // Dynamic sword slash swing
      const slashProgress = (this.animTime * 8) % 1; // 0 to 1
      const slashAngle = -Math.PI * 0.8 + slashProgress * Math.PI * 1.2;
      this.rightArmGroup.rotation.set(slashAngle, -0.3, -0.2);
      this.leftArmGroup.rotation.set(0.3, 0, 0.2);
      this.torsoMesh.rotation.y = Math.sin(slashProgress * Math.PI) * 0.4;
      this.torsoMesh.position.y = 3.0;
    } else if (state === 'wave') {
      // Waving right hand
      this.rightArmGroup.rotation.set(-2.4, 0, 0.4 + Math.sin(this.animTime * 12) * 0.3);
      this.leftArmGroup.rotation.set(0, 0, 0.08);
      this.leftLegGroup.rotation.set(0, 0, 0);
      this.rightLegGroup.rotation.set(0, 0, 0);
      this.torsoMesh.position.y = 3.0;
    } else if (state === 'highfive_wait') {
      // High-Five Wait pose: right hand raised high & open, swaying & waiting for partner
      const wave = Math.sin(this.animTime * 5) * 0.12;
      this.rightArmGroup.rotation.set(-2.4 + wave, -0.2, 0.2);
      this.leftArmGroup.rotation.set(0, 0, 0.08);
      this.leftLegGroup.rotation.set(0, 0, 0);
      this.rightLegGroup.rotation.set(0, 0, 0);
      this.torsoMesh.rotation.y = wave * 0.2;
      this.torsoMesh.position.y = 3.0 + Math.abs(wave) * 0.05;
    } else if (state === 'highfive_snap') {
      // High-Five Snap: energetic hand slap forward with wind-up & recoil!
      const slapCycle = (this.animTime * 4) % Math.PI;
      const slapProgress = Math.min(this.animTime * 3.5, 1.0);
      const slap = Math.sin(slapProgress * Math.PI);
      const recoil = Math.sin(this.animTime * 12) * Math.exp(-this.animTime * 2);

      this.rightArmGroup.rotation.set(-1.4 - slap * 0.6 + recoil * 0.15, -0.1, 0);
      this.leftArmGroup.rotation.set(0.3, 0, 0.1);
      this.torsoMesh.rotation.x = -slap * 0.2;
      this.torsoMesh.rotation.y = recoil * 0.1;
      this.headGroup.rotation.x = slap * 0.15;
      this.torsoMesh.position.y = 3.0 + slap * 0.1;
    } else if (state === 'hug_wait') {
      // Hug Wait: arms wide open, stepping side-to-side invitingly
      const sway = Math.sin(this.animTime * 3.5) * 0.15;
      this.leftArmGroup.rotation.set(-1.2, -0.7, -0.4 + sway);
      this.rightArmGroup.rotation.set(-1.2, 0.7, 0.4 - sway);
      this.leftLegGroup.rotation.set(sway * 0.2, 0, 0);
      this.rightLegGroup.rotation.set(-sway * 0.2, 0, 0);
      this.torsoMesh.rotation.y = sway * 0.3;
      this.torsoMesh.position.y = 3.0 + Math.abs(sway) * 0.08;
    } else if (state === 'hug_snap') {
      // Hug Snap: warm embrace, swaying together & patting partner on back
      const hugSway = Math.sin(this.animTime * 3.0) * 0.12;
      const pat = Math.sin(this.animTime * 8.0) * 0.08;
      this.leftArmGroup.rotation.set(-1.3, 0.8, -0.1);
      this.rightArmGroup.rotation.set(-1.3 + pat, -0.8, 0.1);
      this.leftLegGroup.rotation.set(hugSway * 0.15, 0, 0);
      this.rightLegGroup.rotation.set(-hugSway * 0.15, 0, 0);
      this.torsoMesh.rotation.z = hugSway * 0.8;
      this.torsoMesh.rotation.x = 0.08;
      this.headGroup.rotation.z = -hugSway * 0.4;
      this.torsoMesh.position.y = 3.0 + Math.abs(hugSway) * 0.05;
    } else if (state === 'rps_wait') {
      // RPS Wait: energetic 1-2-3 fist pumping & body bounce
      const pump = Math.abs(Math.sin(this.animTime * 10)) * 0.7;
      this.rightArmGroup.rotation.set(-2.0 + pump, -0.15, 0);
      this.leftArmGroup.rotation.set(0.3, 0, 0.1);
      this.torsoMesh.rotation.x = -pump * 0.1;
      this.headGroup.rotation.x = pump * 0.1;
      this.torsoMesh.position.y = 3.0 + pump * 0.15;
    } else if (state === 'rps_rock' || state === 'rps_paper' || state === 'rps_scissors') {
      // RPS Reveal: arm thrust forward with distinct stance
      const revealBounce = Math.sin(Math.min(this.animTime * 7, Math.PI)) * 0.25;
      const jitter = Math.sin(this.animTime * 14) * 0.03;
      
      this.rightArmGroup.rotation.set(-1.4 - revealBounce, jitter, state === 'rps_scissors' ? 0.3 : (state === 'rps_paper' ? -0.2 : 0));
      this.leftArmGroup.rotation.set(0.4, 0, 0.15);
      this.torsoMesh.rotation.x = -0.18 - revealBounce * 0.4;
      this.headGroup.rotation.x = 0.12;
      this.torsoMesh.position.y = 3.0 + revealBounce;
    } else if (state === 'duodance_1' || state === 'duodance_2') {
      // Duo Sync Dance: stylish multi-phase rhythm with hip twists & arm waves
      const danceFreq = 7;
      const beat = Math.sin(this.animTime * danceFreq);
      const mult = state === 'duodance_2' ? -1 : 1;
      const bodyTwist = beat * 0.45 * mult;
      const verticalBounce = Math.abs(Math.sin(this.animTime * danceFreq * 2)) * 0.3;

      this.torsoMesh.rotation.y = bodyTwist;
      this.torsoMesh.rotation.z = beat * 0.12 * mult;
      this.torsoMesh.position.y = 3.0 + verticalBounce;

      this.leftArmGroup.rotation.set(-1.6 + beat * 0.4 * mult, beat * 0.3, -0.4);
      this.rightArmGroup.rotation.set(-1.6 - beat * 0.4 * mult, -beat * 0.3, 0.4);
      this.leftLegGroup.rotation.set(beat * 0.35 * mult, 0, -0.1);
      this.rightLegGroup.rotation.set(-beat * 0.35 * mult, 0, 0.1);
      this.headGroup.rotation.y = -bodyTwist * 0.5;
    } else if (state === 'carry_base') {
      // Carrying partner on back: squatted stance, arms hooked under partner's legs
      const walkBob = moveSpeed > 0.5 ? Math.sin(this.animTime * 10) * 0.15 : Math.sin(this.animTime * 2.5) * 0.04;
      this.leftLegGroup.rotation.set(0.35, 0, 0);
      this.rightLegGroup.rotation.set(0.35, 0, 0);
      this.leftArmGroup.rotation.set(1.1, 0.35, -0.25);
      this.rightArmGroup.rotation.set(1.1, -0.35, 0.25);
      this.torsoMesh.rotation.x = 0.16; // forward lean to support rider
      this.torsoMesh.position.y = 2.6 + walkBob;
    } else if (state === 'carry_rider') {
      // Riding on partner's back: mounted position, legs wrapped, arms over shoulders
      const rideBob = moveSpeed > 0.5 ? Math.sin(this.animTime * 10) * 0.15 : Math.sin(this.animTime * 2.5) * 0.04;
      this.leftLegGroup.rotation.set(-1.3, 0.35, 0);
      this.rightLegGroup.rotation.set(-1.3, -0.35, 0);
      this.leftArmGroup.rotation.set(-1.3, 0.5, 0.1);
      this.rightArmGroup.rotation.set(-1.3, -0.5, -0.1);
      this.torsoMesh.rotation.x = 0.1;
      this.torsoMesh.position.y = 2.9 + rideBob;
    } else if (state === 'dance') {
      // Verlex Dance
      const danceFreq = 6;
      const angle = Math.sin(this.animTime * danceFreq);
      this.torsoMesh.rotation.y = angle * 0.6;
      this.torsoMesh.position.y = 3.0 + Math.abs(Math.sin(this.animTime * danceFreq * 2)) * 0.2;

      this.leftArmGroup.rotation.set(-1.0 + angle * 0.5, 0, -0.5);
      this.rightArmGroup.rotation.set(-1.0 - angle * 0.5, 0, 0.5);
      this.leftLegGroup.rotation.set(angle * 0.3, 0, -0.1);
      this.rightLegGroup.rotation.set(-angle * 0.3, 0, 0.1);
    } else {
      // Idle state: subtle breathing
      const idleWave = Math.sin(this.animTime * 2.5) * 0.04;
      this.torsoMesh.position.y = 3.0 + idleWave * 0.5;
      this.leftLegGroup.rotation.set(0, 0, 0);
      this.rightLegGroup.rotation.set(0, 0, 0);
      this.leftArmGroup.rotation.set(idleWave, 0, 0.06);

      if (hasTool) {
        this.rightArmGroup.rotation.set(-Math.PI / 2, 0, 0);
      } else {
        this.rightArmGroup.rotation.set(-idleWave, 0, -0.06);
      }
    }
  }

  public collabPromptSprite: THREE.Sprite | null = null;

  public showCollabPrompt(title: string, sub: string = 'Press [E] nearby to join!') {
    this.clearCollabPrompt();
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 110;
    const ctx = canvas.getContext('2d')!;

    // Shiny prompt pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8'; // cyan border
    ctx.lineWidth = 4;
    this.drawRoundRect(ctx, 10, 10, 420, 90, 20);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#facc15'; // bright yellow
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 220, 42);

    // Subtitle
    ctx.fillStyle = '#38bdf8'; // cyan
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(sub, 220, 74);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    this.collabPromptSprite = new THREE.Sprite(spriteMat);
    this.collabPromptSprite.scale.set(4.8, 1.2, 1);
    this.collabPromptSprite.position.set(0, 7.2, 0);
    this.rootGroup.add(this.collabPromptSprite);
  }

  public clearCollabPrompt() {
    if (this.collabPromptSprite) {
      this.rootGroup.remove(this.collabPromptSprite);
      this.collabPromptSprite.material.dispose();
      this.collabPromptSprite = null;
    }
  }

  public setPositionAndRotation(pos: [number, number, number], rotY: number) {
    this.rootGroup.position.set(pos[0], pos[1], pos[2]);
    this.rootGroup.rotation.y = rotY;
  }
}

