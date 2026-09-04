const fs = require('fs');
let code = fs.readFileSync('src/game/maps.ts', 'utf8');

const insertion = `
  if (template === 'studio_map') {
    let customBlocks = [];
    try {
      const stored = localStorage.getItem('verlex_studio_blocks');
      if (stored) {
        customBlocks = JSON.parse(stored);
      }
    } catch (e) {}

    // Add baseplate
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

    customBlocks.forEach((block) => {
      parts.push({
        ...block,
        shape: block.shape || 'block',
        material: block.material || 'plastic',
        surfaceType: block.surfaceType || 'smooth',
        anchored: block.anchored !== undefined ? block.anchored : true,
        canCollide: block.canCollide !== undefined ? block.canCollide : true,
      });
    });
  }
`;

code = code.replace("if (template === 'baseplate') {", insertion + "\n  if (template === 'baseplate') {");
fs.writeFileSync('src/game/maps.ts', code);
