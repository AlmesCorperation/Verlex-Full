import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

# Patch maps.ts
maps_old = "if (template === 'baseplate') {"
maps_new = """
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

  if (template === 'baseplate') {"""
replace_in_file('src/game/maps.ts', maps_old, maps_new)

# Patch Header.tsx
header_old = '<span className="text-blue-200 opacity-60">|</span>'
header_new = """<span className="text-blue-200 opacity-60">|</span>
          <button
            id="nav-studio"
            onClick={() => {
              sounds.playClick();
              onNavigate('studio');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer ${
              currentPage === 'studio' ? 'text-yellow-300 underline font-black' : 'text-white'
            }`}
          >
            Studio
          </button>
          """
replace_in_file('src/components/Header.tsx', header_old, header_new)

# Patch App.tsx
app_old_import = "import { ForumPage } from './components/ForumPage';"
app_new_import = "import { ForumPage } from './components/ForumPage';\nimport { VerlexStudioPage } from './components/VerlexStudioPage';"
replace_in_file('src/App.tsx', app_old_import, app_new_import)

app_old_render = "{currentSitePage === 'forum' && <ForumPage />}"
app_new_render = "{currentSitePage === 'forum' && <ForumPage />}\n        {currentSitePage === 'studio' && <VerlexStudioPage onLaunchGame={() => handleLaunch3DGame('studio_map')} />}"
replace_in_file('src/App.tsx', app_old_render, app_new_render)
