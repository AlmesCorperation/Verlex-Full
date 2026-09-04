import * as THREE from 'three';
import { PartData, PartMaterial, PartShape, SurfaceType } from '../types';
import { textureFactory } from './studTextures';

export class MeshFactory {
  private static materialCache: Map<string, THREE.Material | THREE.Material[]> = new Map();

  /**
   * Creates a materials array or single material for a Part
   */
  public static createPartMaterial(
    colorHex: string,
    material: PartMaterial,
    surfaceType: SurfaceType,
    transparency: number = 0,
    reflectance: number = 0,
    specialShape?: PartShape
  ): THREE.Material[] | THREE.Material {
    const key = `${colorHex}_${material}_${surfaceType}_${transparency}_${reflectance}_${specialShape || ''}`;
    if (this.materialCache.has(key)) {
      return this.materialCache.get(key)!;
    }

    const color = new THREE.Color(colorHex);
    const opacity = Math.max(0, Math.min(1, 1 - transparency));
    const isTransparent = transparency > 0.05;

    // Base side & generic material
    const baseOptions: THREE.MeshStandardMaterialParameters = {
      color: color,
      roughness: material === 'metal' ? 0.2 : material === 'smooth' ? 0.3 : material === 'ice' ? 0.05 : 0.6,
      metalness: material === 'metal' ? 0.8 : reflectance > 0 ? reflectance * 0.5 : 0.05,
      transparent: isTransparent,
      opacity: opacity,
    };

    if (material === 'neon') {
      baseOptions.emissive = color;
      baseOptions.emissiveIntensity = 0.85;
      baseOptions.roughness = 0.2;
    } else if (material === 'forcefield') {
      baseOptions.emissive = new THREE.Color(0x3388ff);
      baseOptions.emissiveIntensity = 0.4;
      baseOptions.transparent = true;
      baseOptions.opacity = 0.5;
      baseOptions.wireframe = false;
    } else if (material === 'glass') {
      baseOptions.transparent = true;
      baseOptions.opacity = 0.45;
      baseOptions.roughness = 0.1;
      baseOptions.metalness = 0.1;
    }

    // Top surface with studs texture
    const studTex = textureFactory.getStudTexture(surfaceType);
    const inletTex = textureFactory.getStudTexture('inlets');

    // Create cloned textured materials with appropriate UV repeats
    const topMaterial = new THREE.MeshStandardMaterial({
      ...baseOptions,
      map: studTex,
    });

    const bottomMaterial = new THREE.MeshStandardMaterial({
      ...baseOptions,
      map: inletTex,
    });

    const sideMaterial = new THREE.MeshStandardMaterial(baseOptions);

    let result: THREE.Material | THREE.Material[];

    if (specialShape === 'spawn') {
      const spawnDecal = textureFactory.getSpecialDecal('spawn');
      const spawnTopMat = new THREE.MeshStandardMaterial({
        ...baseOptions,
        map: spawnDecal,
      });
      result = [sideMaterial, sideMaterial, spawnTopMat, bottomMaterial, sideMaterial, sideMaterial];
    } else if (specialShape === 'tnt') {
      const tntDecal = textureFactory.getSpecialDecal('tnt');
      const tntMat = new THREE.MeshStandardMaterial({
        ...baseOptions,
        map: tntDecal,
      });
      result = [tntMat, tntMat, topMaterial, bottomMaterial, tntMat, tntMat];
    } else if (specialShape === 'trampoline') {
      const trampDecal = textureFactory.getSpecialDecal('trampoline');
      const trampTopMat = new THREE.MeshStandardMaterial({
        ...baseOptions,
        map: trampDecal,
        emissive: new THREE.Color(0x00ff88),
        emissiveIntensity: 0.3,
      });
      result = [sideMaterial, sideMaterial, trampTopMat, bottomMaterial, sideMaterial, sideMaterial];
    } else if (specialShape === 'conveyor') {
      const convDecal = textureFactory.getSpecialDecal('conveyor');
      const convTopMat = new THREE.MeshStandardMaterial({
        ...baseOptions,
        map: convDecal,
      });
      result = [sideMaterial, sideMaterial, convTopMat, bottomMaterial, sideMaterial, sideMaterial];
    } else {
      // Order of faces for Three.js BoxGeometry:
      // 0: Right (+x), 1: Left (-x), 2: Top (+y), 3: Bottom (-y), 4: Front (+z), 5: Back (-z)
      result = [
        sideMaterial,
        sideMaterial,
        topMaterial,
        bottomMaterial,
        sideMaterial,
        sideMaterial,
      ];
    }

    this.materialCache.set(key, result);
    return result;
  }

  /**
   * Creates a complete 3D Mesh for any PartData definition
   */
  public static createPartMesh(part: PartData): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    const [sx, sy, sz] = part.size;

    switch (part.shape) {
      case 'wedge': {
        // Create Verlex Right-angle Wedge
        // Slanted face goes up from -z to +z or front to back
        const geom = new THREE.BufferGeometry();
        // 5 faces: bottom, back, front/ramp, left, right
        const hx = sx / 2;
        const hy = sy / 2;
        const hz = sz / 2;

        // Vertices
        const positions = new Float32Array([
          // Bottom face
          -hx, -hy, -hz,   hx, -hy, -hz,   hx, -hy, hz,
          -hx, -hy, -hz,   hx, -hy, hz,   -hx, -hy, hz,
          // Back vertical face (+z)
          -hx, -hy, hz,    hx, -hy, hz,    hx, hy, hz,
          -hx, -hy, hz,    hx, hy, hz,    -hx, hy, hz,
          // Slanted ramp face
          -hx, -hy, -hz,   -hx, hy, hz,    hx, hy, hz,
          -hx, -hy, -hz,   hx, hy, hz,     hx, -hy, -hz,
          // Left triangle face
          -hx, -hy, -hz,   -hx, -hy, hz,   -hx, hy, hz,
          // Right triangle face
          hx, -hy, -hz,    hx, hy, hz,     hx, -hy, hz,
        ]);

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.computeVertexNormals();
        geometry = geom;
        break;
      }

      case 'cylinder': {
        // Verlex cylinder
        geometry = new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 24);
        break;
      }

      case 'sphere': {
        // Verlex ball
        geometry = new THREE.SphereGeometry(sx / 2, 20, 20);
        break;
      }

      case 'truss': {
        // Lattice Truss structure
        geometry = new THREE.BoxGeometry(sx, sy, sz);
        break;
      }

      case 'block':
      case 'spawn':
      case 'trampoline':
      case 'conveyor':
      case 'tnt':
      case 'dummy':
      default: {
        // Torso is the base mesh geometry for 'dummy'
        const meshWidth = part.shape === 'dummy' ? sx * 0.5 : sx;
        const meshHeight = part.shape === 'dummy' ? sy * 0.4 : sy;
        geometry = new THREE.BoxGeometry(meshWidth, meshHeight, sz);
        break;
      }
    }

    const materials = this.createPartMaterial(
      part.color,
      part.material,
      part.surfaceType,
      part.transparency,
      part.reflectance,
      part.shape
    );

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.set(part.position[0], part.position[1], part.position[2]);
    mesh.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { partId: part.id, partData: part };

    if (part.shape === 'dummy') {
      // Color-coded parts of the Dummy classic style
      // Yellow Head
      const headGeom = new THREE.BoxGeometry(sx * 0.25, sy * 0.2, sz);
      // Create smiley face canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f5dc3d'; // classic yellow
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.fillStyle = '#111111';
        // Eyes
        ctx.fillRect(16, 20, 6, 12);
        ctx.fillRect(42, 20, 6, 12);
        // Smile
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(32, 34, 14, 0, Math.PI, false);
        ctx.stroke();
      }
      const faceTex = new THREE.CanvasTexture(canvas);
      const headMats = [
        new THREE.MeshStandardMaterial({ color: 0xf5dc3d, roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0xf5dc3d, roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0xf5dc3d, roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0xf5dc3d, roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0xf5dc3d, roughness: 0.5 }),
      ];
      const head = new THREE.Mesh(headGeom, headMats);
      head.position.set(0, sy * 0.3, 0); // Torso top is sy*0.2, Head center is sy*0.3
      head.castShadow = true;
      mesh.add(head);

      // Yellow Arms
      const armGeom = new THREE.BoxGeometry(sx * 0.25, sy * 0.4, sz);
      const limbMat = new THREE.MeshStandardMaterial({ color: 0xf5dc3d, roughness: 0.5 });
      const leftArm = new THREE.Mesh(armGeom, limbMat);
      leftArm.position.set(-sx * 0.375, 0, 0);
      leftArm.castShadow = true;
      mesh.add(leftArm);

      const rightArm = new THREE.Mesh(armGeom, limbMat);
      rightArm.position.set(sx * 0.375, 0, 0);
      rightArm.castShadow = true;
      mesh.add(rightArm);

      // Green Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.5 });
      const legGeom = new THREE.BoxGeometry(sx * 0.25, sy * 0.4, sz);
      const leftLeg = new THREE.Mesh(legGeom, legMat);
      leftLeg.position.set(-sx * 0.125, -sy * 0.4, 0);
      leftLeg.castShadow = true;
      mesh.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeom, legMat);
      rightLeg.position.set(sx * 0.125, -sy * 0.4, 0);
      rightLeg.castShadow = true;
      mesh.add(rightLeg);

      // Build initial overhead health/name tag
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
        const currentHP = part.health !== undefined ? part.health : 100;
        const maxHP = part.maxHealth !== undefined ? part.maxHealth : 100;
        ctxHP.fillRect(4, 4, Math.max(0, (currentHP / maxHP) * 120), 24);
        
        ctxHP.fillStyle = '#ffffff';
        ctxHP.font = 'bold 12px sans-serif';
        ctxHP.textAlign = 'center';
        ctxHP.fillText(part.name || 'Dummy', 64, 20);
      }
      const hpTex = new THREE.CanvasTexture(canvasHP);
      const tagMat = new THREE.SpriteMaterial({ map: hpTex });
      const hpSprite = new THREE.Sprite(tagMat);
      hpSprite.position.set(0, sy * 0.5 + 0.8, 0);
      hpSprite.scale.set(3, 0.75, 1);
      hpSprite.name = 'healthTag';
      mesh.add(hpSprite);
    }

    if (part.name && part.name.startsWith('🪦')) {
      const canvasGrave = document.createElement('canvas');
      canvasGrave.width = 160;
      canvasGrave.height = 48;
      const ctxGrave = canvasGrave.getContext('2d');
      if (ctxGrave) {
        ctxGrave.fillStyle = 'rgba(25,25,25,0.85)';
        ctxGrave.fillRect(0, 0, 160, 48);
        ctxGrave.strokeStyle = '#ef4444';
        ctxGrave.lineWidth = 2;
        ctxGrave.strokeRect(2, 2, 156, 44);

        ctxGrave.fillStyle = '#f3f4f6';
        ctxGrave.font = 'bold 11px sans-serif';
        ctxGrave.textAlign = 'center';
        ctxGrave.fillText('HERE LIES', 80, 18);
        ctxGrave.fillStyle = '#ef4444';
        ctxGrave.font = 'bold 13px sans-serif';
        ctxGrave.fillText(part.name.replace('🪦', '').trim(), 80, 36);
      }
      const graveTex = new THREE.CanvasTexture(canvasGrave);
      const tagMat = new THREE.SpriteMaterial({ map: graveTex });
      const graveSprite = new THREE.Sprite(tagMat);
      graveSprite.position.set(0, sy * 0.5 + 1.2, 0);
      graveSprite.scale.set(4, 1.2, 1);
      graveSprite.name = 'graveTag';
      mesh.add(graveSprite);
    }

    // Configure repeat on textures based on size in studs
    if (Array.isArray(materials)) {
      const topMat = materials[2] as THREE.MeshStandardMaterial;
      if (topMat && topMat.map && part.shape !== 'spawn' && part.shape !== 'trampoline') {
        topMat.map.repeat.set(Math.max(1, Math.round(sx)), Math.max(1, Math.round(sz)));
        topMat.map.needsUpdate = true;
      }
    }

    return mesh;
  }

  /**
   * Helper to build a Verlex tool (Rocket Launcher, Sword, Slingshot, Gravity Gun)
   */
  public static createToolMesh(tool: string): THREE.Group {
    const group = new THREE.Group();

    if (tool === 'sword') {
      // Linked Sword
      // Hilt (grey cylinder/box)
      const hilt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 })
      );
      hilt.position.y = -0.3;
      group.add(hilt);

      // Crossguard (golden/metallic)
      const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.1, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 })
      );
      guard.position.y = 0.05;
      group.add(guard);

      // Blade (shiny silver with tapered tip)
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 1.6, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xe0e8f0, metalness: 0.9, roughness: 0.1 })
      );
      blade.position.y = 0.9;
      group.add(blade);
    } else if (tool === 'rocket') {
      // Verlex Green Rocket Launcher
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 1.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.5 })
      );
      barrel.rotation.x = Math.PI / 2;
      group.add(barrel);

      // Handle
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.5, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      handle.position.set(0, -0.35, 0.2);
      group.add(handle);

      // Exhaust cone
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.26, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      cone.rotation.x = -Math.PI / 2;
      cone.position.z = -0.9;
      group.add(cone);
    } else if (tool === 'gravity') {
      // Futuristic blue glowing Physics Gravity Gun
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.35, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.7, roughness: 0.3 })
      );
      group.add(body);

      // Glowing emitter core
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00d2ff, emissiveIntensity: 1.5 })
      );
      core.rotation.x = Math.PI / 2;
      core.position.z = 0.65;
      group.add(core);

      // Triple prongs
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const prong = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.05, 0.4),
          new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.9 })
        );
        prong.position.set(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0.8);
        prong.rotation.z = angle;
        group.add(prong);
      }
    } else if (tool === 'paint') {
      // Paint Spray Canister
      const can = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.7, 12),
        new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.3 })
      );
      group.add(can);

      const nozzle = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.12, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      nozzle.position.y = 0.4;
      group.add(nozzle);
    } else if (tool === 'push') {
      // Boxing Glove / Shove Tool
      const glove = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.6 })
      );
      glove.position.z = 0.4;
      group.add(glove);

      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x2d3436 })
      );
      stick.rotation.x = Math.PI / 2;
      group.add(stick);
    } else if (tool === 'delete') {
      // Sledgehammer
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 })
      );
      group.add(handle);

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8, roughness: 0.3 })
      );
      head.position.y = 0.6;
      group.add(head);
    } else if (tool === 'build') {
      // Stud Trowel / Stamper
      const trowelBlade = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.05, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xdfe6e9, metalness: 0.85, roughness: 0.2 })
      );
      trowelBlade.position.set(0, 0.2, 0.3);
      group.add(trowelBlade);

      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x6c5ce7, roughness: 0.5 })
      );
      handle.position.set(0, -0.1, 0);
      group.add(handle);
    }

    return group;
  }
}
