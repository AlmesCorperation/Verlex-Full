import { MapTemplateId, PartData } from '../types';

export function createMap(template: MapTemplateId, customPlaceParts?: PartData[]): PartData[] {
  const parts: PartData[] = [];
  let idCounter = 1;

  const createPart = (
    name: string,
    shape: PartData['shape'],
    pos: [number, number, number],
    size: [number, number, number],
    color: string,
    anchored: boolean = true,
    material: PartData['material'] = 'plastic',
    surfaceType: PartData['surfaceType'] = 'studs',
    canCollide: boolean = true,
    transparency: number = 0
  ): PartData => {
    return {
      id: `part_${idCounter++}_${Date.now()}`,
      name,
      shape,
      position: pos,
      size,
      rotation: [0, 0, 0],
      color,
      material,
      surfaceType,
      anchored,
      canCollide,
      transparency,
      reflectance: 0,
    };
  };

  if (template === 'studio_map') {
    let customBlocks: PartData[] = [];

    // 1. Direct argument customPlaceParts has top priority
    if (customPlaceParts && customPlaceParts.length > 0) {
      customBlocks = customPlaceParts;
    } else {
      // 2. Active custom place stored when clicking play/test
      try {
        const activeStored = localStorage.getItem('verlex_active_custom_place');
        if (activeStored) {
          const parsed = JSON.parse(activeStored);
          if (parsed.parts && Array.isArray(parsed.parts) && parsed.parts.length > 0) {
            customBlocks = parsed.parts;
          }
        }
      } catch (e) {}

      // 3. Saved studio place
      if (customBlocks.length === 0) {
        try {
          const savedPlace = localStorage.getItem('verlex_studio_saved_place');
          if (savedPlace) {
            const parsed = JSON.parse(savedPlace);
            if (parsed.parts && Array.isArray(parsed.parts) && parsed.parts.length > 0) {
              customBlocks = parsed.parts;
            }
          }
        } catch (e) {}
      }

      // 4. Legacy studio blocks fallback
      if (customBlocks.length === 0) {
        try {
          const stored = localStorage.getItem('verlex_studio_blocks');
          if (stored) {
            customBlocks = JSON.parse(stored);
          }
        } catch (e) {}
      }
    }

    if (customBlocks.length > 0) {
      // Return cloned parts to avoid mutating original state
      const result: PartData[] = customBlocks.map((block) => ({
        ...block,
        shape: block.shape || 'block',
        material: block.material || 'plastic',
        surfaceType: block.surfaceType || 'smooth',
        anchored: block.anchored !== undefined ? block.anchored : true,
        canCollide: block.canCollide !== undefined ? block.canCollide : true,
      }));

      // Ensure at least one spawn location exists
      const hasSpawn = result.some((p) => p.shape === 'spawn');
      if (!hasSpawn) {
        result.push({
          id: 'studio_auto_spawn',
          name: 'SpawnLocation',
          shape: 'spawn',
          position: [0, 0.5, 0],
          size: [6, 1, 6],
          rotation: [0, 0, 0],
          color: '#0055ff',
          material: 'plastic',
          surfaceType: 'studs',
          anchored: true,
          canCollide: true,
          transparency: 0,
          reflectance: 0,
        });
      }

      return result;
    }

    // Default baseplate for studio if completely empty
    parts.push({
      id: 'studio_baseplate',
      name: 'Baseplate',
      shape: 'block',
      position: [0, -0.5, 0],
      size: [256, 1, 256],
      rotation: [0, 0, 0],
      color: '#4caf50',
      material: 'plastic',
      surfaceType: 'studs',
      anchored: true,
      canCollide: true,
      transparency: 0,
      reflectance: 0,
    });
    
    parts.push({
      id: 'studio_spawn',
      name: 'SpawnLocation',
      shape: 'spawn',
      position: [0, 0.5, 0],
      size: [6, 1, 6],
      rotation: [0, 0, 0],
      color: '#a3a2a5',
      material: 'plastic',
      surfaceType: 'studs',
      anchored: true,
      canCollide: true,
      transparency: 0,
      reflectance: 0,
    });

    return parts;
  }

  if (template === 'baseplate') {
    // 128x128 stud green baseplate
    parts.push(createPart('Baseplate', 'block', [0, -1, 0], [128, 2, 128], '#27ae60', true, 'plastic', 'studs'));
    // Spawn Location in center
    parts.push(createPart('SpawnLocation', 'spawn', [0, 0.2, 0], [8, 0.4, 8], '#0055ff', true, 'plastic', 'smooth'));

    // A few initial test physics blocks for stacking fun
    for (let y = 0; y < 4; y++) {
      parts.push(createPart(`Physics Brick ${y}`, 'block', [12, 1 + y * 2, 0], [4, 2, 4], '#e74c3c', false));
      parts.push(createPart(`Physics Brick ${y}`, 'block', [-12, 1 + y * 2, 0], [4, 2, 4], '#f1c40f', false));
    }
  } else if (template === 'physics_lab') {
    // Physics Lab with Dominoes, Stacking Tower, and TNT Pyramids
    parts.push(createPart('Floor', 'block', [0, -1, 0], [120, 2, 120], '#34495e', true, 'plastic', 'studs'));
    parts.push(createPart('SpawnLocation', 'spawn', [-40, 0.2, -40], [8, 0.4, 8], '#0055ff', true));

    // Stacking Tower of unanchored colorful bricks (10 layers)
    const towerColors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    for (let layer = 0; layer < 8; layer++) {
      const col = towerColors[layer % towerColors.length];
      const y = 1.0 + layer * 2.0;
      // 2x2 grid of bricks per layer
      parts.push(createPart(`Tower_${layer}_1`, 'block', [0 - 2, y, 0 - 2], [3.8, 1.9, 3.8], col, false));
      parts.push(createPart(`Tower_${layer}_2`, 'block', [0 + 2, y, 0 - 2], [3.8, 1.9, 3.8], col, false));
      parts.push(createPart(`Tower_${layer}_3`, 'block', [0 - 2, y, 0 + 2], [3.8, 1.9, 3.8], col, false));
      parts.push(createPart(`Tower_${layer}_4`, 'block', [0 + 2, y, 0 + 2], [3.8, 1.9, 3.8], col, false));
    }

    // Domino Rally (15 dominoes in a line)
    for (let i = 0; i < 15; i++) {
      parts.push(
        createPart(
          `Domino_${i}`,
          'block',
          [25, 2.5, -30 + i * 4],
          [1.0, 5.0, 2.5],
          i % 2 === 0 ? '#1abc9c' : '#e74c3c',
          false
        )
      );
    }

    // TNT Pyramid at end of dominoes
    parts.push(createPart('TNT_1', 'tnt', [25, 1.5, 34], [4, 3, 4], '#c92a2a', false));
    parts.push(createPart('TNT_2', 'tnt', [25, 4.5, 34], [3, 3, 3], '#c92a2a', false));

    // Trampolines
    parts.push(createPart('Trampoline_1', 'trampoline', [-25, 0.4, 15], [8, 0.8, 8], '#00ff88', true));
    parts.push(createPart('Trampoline_2', 'trampoline', [-25, 0.4, -15], [8, 0.8, 8], '#00ff88', true));

    // Physics spheres & cylinders to push
    for (let i = 0; i < 5; i++) {
      parts.push(createPart(`Bowling Ball ${i}`, 'sphere', [-15, 2 + i * 3, -10 + i * 5], [3, 3, 3], '#9b59b6', false));
      parts.push(createPart(`Physics Barrel ${i}`, 'cylinder', [-10, 2 + i * 3, 20 + i * 3], [3, 4, 3], '#d35400', false));
    }
  } else if (template === 'crossroads') {
    // Verlex Crossroads 
    // Ground Base
    parts.push(createPart('Terrain', 'block', [0, -1, 0], [140, 2, 140], '#27ae60', true, 'plastic', 'studs'));
    parts.push(createPart('LavaMoat', 'block', [0, -0.4, 0], [140, 1, 140], '#d63031', true, 'neon', 'smooth'));
    parts.push(createPart('MainPlaza', 'block', [0, 0.5, 0], [90, 2, 90], '#7f8c8d', true, 'plastic', 'studs'));

    // 4 Castle Corner Towers
    const towerCoords = [
      [-32, -32],
      [32, -32],
      [-32, 32],
      [32, 32],
    ];

    towerCoords.forEach(([tx, tz], idx) => {
      // Tower base
      parts.push(createPart(`CastleTower_${idx}`, 'block', [tx, 10, tz], [14, 20, 14], '#95a5a6', true, 'plastic', 'studs'));
      // Tower top platform
      parts.push(createPart(`TowerTop_${idx}`, 'block', [tx, 20.5, tz], [16, 1, 16], '#7f8c8d', true));
      // Battlements
      parts.push(createPart(`Battlement_1`, 'block', [tx - 7, 22, tz], [2, 2, 16], '#95a5a6', true));
      parts.push(createPart(`Battlement_2`, 'block', [tx + 7, 22, tz], [2, 2, 16], '#95a5a6', true));
      // Truss ladder to top
      parts.push(createPart(`Truss_${idx}`, 'truss', [tx, 10, tz + 7.5], [2, 20, 1], '#e74c3c', true));
    });

    // Elevated suspension bridges
    parts.push(createPart('Bridge_North', 'block', [0, 20, -32], [50, 1, 6], '#8e44ad', true));
    parts.push(createPart('Bridge_South', 'block', [0, 20, 32], [50, 1, 6], '#8e44ad', true));
    parts.push(createPart('Bridge_West', 'block', [-32, 20, 0], [6, 1, 50], '#8e44ad', true));
    parts.push(createPart('Bridge_East', 'block', [32, 20, 0], [6, 1, 50], '#8e44ad', true));

    // Central Spire & Trampoline
    parts.push(createPart('CentralSpire', 'block', [0, 6, 0], [10, 12, 10], '#2c3e50', true));
    parts.push(createPart('CentralLaunch', 'trampoline', [0, 12.5, 0], [8, 1, 8], '#00ff88', true));

    // Spawn pads
    parts.push(createPart('Spawn_1', 'spawn', [-25, 1.7, -25], [6, 0.4, 6], '#0055ff', true));
    parts.push(createPart('Spawn_2', 'spawn', [25, 1.7, 25], [6, 0.4, 6], '#e74c3c', true));

    // Unanchored debris & bricks on bridge for physics battles
    for (let i = -3; i <= 3; i++) {
      if (i !== 0) {
        parts.push(createPart(`PhysicsBridgeBlock_${i}`, 'block', [i * 6, 22, -32], [3, 2, 3], '#f39c12', false));
      }
    }
  } else if (template === 'happy_home') {
    // Verlex Happy Home in Verlexia
    parts.push(createPart('Grass', 'block', [0, -1, 0], [120, 2, 120], '#27ae60', true, 'plastic', 'studs'));
    parts.push(createPart('Driveway', 'block', [0, 0.05, 30], [14, 0.1, 40], '#7f8c8d', true));

    // House Floor
    parts.push(createPart('Floor', 'block', [0, 0.5, -5], [36, 1, 36], '#bdc3c7', true));

    // Walls
    // Back wall
    parts.push(createPart('WallBack', 'block', [0, 8, -22.5], [36, 14, 1], '#ecf0f1', true));
    // Left wall
    parts.push(createPart('WallLeft', 'block', [-17.5, 8, -5], [1, 14, 36], '#ecf0f1', true));
    // Right wall
    parts.push(createPart('WallRight', 'block', [17.5, 8, -5], [1, 14, 36], '#ecf0f1', true));
    // Front walls with door opening
    parts.push(createPart('WallFrontL', 'block', [-11, 8, 12.5], [14, 14, 1], '#ecf0f1', true));
    parts.push(createPart('WallFrontR', 'block', [11, 8, 12.5], [14, 14, 1], '#ecf0f1', true));
    parts.push(createPart('WallFrontTop', 'block', [0, 13, 12.5], [8, 4, 1], '#ecf0f1', true));

    // 2nd Floor
    parts.push(createPart('SecondFloor', 'block', [0, 7.5, -5], [36, 1, 36], '#f39c12', true, 'wood'));
    // Staircase wedges
    for (let step = 0; step < 7; step++) {
      parts.push(
        createPart(
          `Stair_${step}`,
          'block',
          [-12, 1 + step, -18 + step * 2.5],
          [6, 1, 2.5],
          '#d35400',
          true,
          'wood'
        )
      );
    }

    // Red Roof
    parts.push(createPart('RoofL', 'wedge', [-9, 17, -5], [18, 4, 38], '#c0392b', true));
    parts.push(createPart('RoofR', 'wedge', [9, 17, -5], [18, 4, 38], '#c0392b', true));

    // Unanchored physics furniture inside the house!
    parts.push(createPart('Table', 'block', [5, 2.5, -5], [6, 2, 6], '#8e44ad', false));
    parts.push(createPart('Chair_1', 'block', [5, 1.8, -1], [2, 2.5, 2], '#3498db', false));
    parts.push(createPart('Chair_2', 'block', [5, 1.8, -9], [2, 2.5, 2], '#3498db', false));
    parts.push(createPart('Lamp', 'cylinder', [5, 4.5, -5], [1.5, 2, 1.5], '#f1c40f', false, 'neon'));

    // Pine trees outside
    [-35, 35].forEach((tx, idx) => {
      parts.push(createPart(`Trunk_${idx}`, 'cylinder', [tx, 4, -10], [2, 8, 2], '#795548', true, 'wood'));
      parts.push(createPart(`Foliage1_${idx}`, 'block', [tx, 9, -10], [8, 3, 8], '#2e7d32', true));
      parts.push(createPart(`Foliage2_${idx}`, 'block', [tx, 12, -10], [6, 3, 6], '#388e3c', true));
      parts.push(createPart(`Foliage3_${idx}`, 'block', [tx, 15, -10], [4, 3, 4], '#4caf50', true));
    });

    parts.push(createPart('Spawn', 'spawn', [0, 0.2, 38], [6, 0.4, 6], '#0055ff', true));
  } else if (template === 'obby') {
    // Obstacle Course (Obby)
    parts.push(createPart('StartPlatform', 'spawn', [0, 0, -40], [12, 1, 12], '#0055ff', true));

    // Step 1: Stud jump pads
    for (let i = 0; i < 5; i++) {
      parts.push(
        createPart(
          `JumpPad_${i}`,
          'block',
          [Math.sin(i) * 6, 1 + i * 2, -28 + i * 10],
          [4, 1, 4],
          '#f39c12',
          true
        )
      );
    }

    // Step 2: Red Lava / Kill-Bricks gap
    parts.push(createPart('LavaPit', 'block', [0, 10, 24], [24, 0.8, 16], '#e74c3c', true, 'neon'));
    // Stepping stones across lava
    for (let i = 0; i < 3; i++) {
      parts.push(
        createPart(
          `SafeStone_${i}`,
          'block',
          [-6 + i * 6, 11, 24],
          [2.5, 1, 2.5],
          '#2ecc71',
          true
        )
      );
    }

    // Step 3: Speed Conveyor
    parts.push(createPart('ConveyorBridge', 'conveyor', [0, 12, 45], [6, 1, 22], '#ffaa00', true));

    // Step 4: Mega Trampoline High Jump
    parts.push(createPart('HighJumpTrampoline', 'trampoline', [0, 12.5, 60], [8, 1, 8], '#00ff88', true));

    // Step 5: Truss climb
    parts.push(createPart('TrussWall', 'truss', [0, 28, 75], [4, 28, 1], '#e67e22', true));

    // Step 6: Victory Winner Platform
    parts.push(createPart('WinnerPlatform', 'block', [0, 42, 85], [16, 1, 16], '#f1c40f', true, 'neon'));
    parts.push(createPart('WinnerCrown', 'sphere', [0, 45, 85], [4, 4, 4], '#ffd700', false, 'neon'));
  }

  return parts;
}
