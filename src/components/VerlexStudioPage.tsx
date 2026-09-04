import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Play, 
  Square, 
  Box, 
  Network, 
  Trash2, 
  Terminal, 
  Folder, 
  FileCode, 
  Sliders, 
  Sparkles, 
  Layers, 
  Eye, 
  Save, 
  Move, 
  RotateCw, 
  Maximize2, 
  Grid, 
  Sun, 
  Package, 
  CheckCircle2,
  Focus,
  Compass,
  Copy,
  Zap,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../game/soundEngine';
import { PartData, PartMaterial, PartShape, RemixedPlace, SurfaceType } from '../types';
import { NetworkTopologyModal } from './NetworkTopologyModal';
import { remixService } from '../services/remixService';
import { MeshFactory } from '../game/meshFactory';

interface VerlexStudioPageProps {
  onLaunchGame: (mapId?: string, customPlace?: RemixedPlace) => void;
  activeRemixPlace?: RemixedPlace | null;
}

export const VerlexStudioPage: React.FC<VerlexStudioPageProps> = ({ 
  onLaunchGame,
  activeRemixPlace = null
}) => {
  // Studio Ribbon Tab
  const [ribbonTab, setRibbonTab] = useState<'home' | 'model' | 'test' | 'view' | 'script'>('home');
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'rotate' | 'scale'>('select');
  const [gridSnap, setGridSnap] = useState<number>(1); // 1, 2, 4 studs
  
  // Selected Place State (remixed or default studio place)
  const [currentPlace, setCurrentPlace] = useState<RemixedPlace>(() => {
    if (activeRemixPlace) return activeRemixPlace;
    
    // Check saved studio place or active custom place
    try {
      const activeStored = localStorage.getItem('verlex_active_custom_place');
      if (activeStored) {
        const parsed = JSON.parse(activeStored);
        if (parsed && parsed.parts && parsed.parts.length > 0) return parsed;
      }
      const saved = localStorage.getItem('verlex_studio_saved_place');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    return {
      id: 'studio_place_main',
      title: 'Verlex Studio Baseplate World',
      creator: 'Builderman',
      remixInfo: { isRemix: false, originalGameId: 'baseplate', originalTitle: 'Baseplate', originalCreator: 'Builderman', remixedAt: Date.now() },
      parts: [
        { id: 'baseplate_1', name: 'Baseplate', shape: 'block', position: [0, -0.5, 0], size: [128, 1, 128], rotation: [0, 0, 0], color: '#27ae60', material: 'plastic', surfaceType: 'studs', anchored: true, canCollide: true, transparency: 0, reflectance: 0 },
        { id: 'spawn_1', name: 'SpawnLocation', shape: 'spawn', position: [0, 0.5, 0], size: [6, 0.4, 6], rotation: [0, 0, 0], color: '#0055ff', material: 'plastic', surfaceType: 'smooth', anchored: true, canCollide: true, transparency: 0, reflectance: 0 },
        { id: 'brick_1', name: 'Neon Accent Pillar', shape: 'block', position: [10, 6, 10], size: [4, 12, 4], rotation: [0, 0, 0], color: '#ff0055', material: 'neon', surfaceType: 'smooth', anchored: true, canCollide: true, transparency: 0, reflectance: 0 },
        { id: 'brick_2', name: 'Cyan Glass Column', shape: 'cylinder', position: [-10, 6, 10], size: [4, 12, 4], rotation: [0, 0, 0], color: '#00d2ff', material: 'glass', surfaceType: 'smooth', anchored: true, canCollide: true, transparency: 0.4, reflectance: 0.3 }
      ],
      pythonCode: `import verlex

print("Welcome to Verlex Studio Full Environment!")

def on_player_join(player):
    print(f"Player {player.name} connected to server.")

verlex.on("player_join", on_player_join)
`,
      networkConfig: { topologyMode: 'p2p_mesh', targetTickRate: 60, interpolationBufferMs: 50, packetLossPercent: 0, latencyJitterMs: 5, bandwidthLimitKbps: 0, maxPeerConnections: 12, protocolFormat: 'msgpack', enableDeltaCompression: true, enableEncryption: true, activePeersCount: 4 },
      updatedAt: Date.now(),
    };
  });

  // Selected Object in Explorer Tree
  const [selectedPartId, setSelectedPartId] = useState<string | null>('baseplate_1');
  const selectedPart = currentPlace.parts.find(p => p.id === selectedPartId) || null;

  // Viewport mode: 'edit' | 'simulating'
  const [simulationState, setSimulationState] = useState<'edit' | 'simulating'>('edit');

  // Script & Console State
  const [scriptCode, setScriptCode] = useState<string>(currentPlace.pythonCode);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '> Verlex Studio Full 3D Engine Initialized.',
    '> Viewport active: Left-click drag to rotate camera, Right-click to pan, Scroll to zoom.',
    '> Click any 3D object in viewport to select and inspect properties.'
  ]);

  // Modals & Panels
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // 3D Canvas Refs
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const partMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);

  // Camera Orbit State
  const cameraStateRef = useRef<{
    azimuth: number;
    polar: number;
    distance: number;
    target: THREE.Vector3;
  }>({
    azimuth: Math.PI / 4,
    polar: Math.PI / 3,
    distance: 45,
    target: new THREE.Vector3(0, 2, 0)
  });

  // Sync activeRemixPlace if passed
  useEffect(() => {
    if (activeRemixPlace) {
      setCurrentPlace(activeRemixPlace);
      setScriptCode(activeRemixPlace.pythonCode);
      if (activeRemixPlace.parts.length > 0) {
        setSelectedPartId(activeRemixPlace.parts[0].id);
      }
    }
  }, [activeRemixPlace]);

  // Update Camera Matrix
  const updateCameraPosition = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const { azimuth, polar, distance, target } = cameraStateRef.current;
    
    cam.position.x = target.x + distance * Math.sin(polar) * Math.sin(azimuth);
    cam.position.y = target.y + distance * Math.cos(polar);
    cam.position.z = target.z + distance * Math.sin(polar) * Math.cos(azimuth);
    cam.lookAt(target);
  }, []);

  // Initialize Three.js Viewport
  useEffect(() => {
    const container = viewportContainerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e111a);
    scene.fog = new THREE.FogExp2(0x0e111a, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xdde8ff, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x7090cf, 0x182035, 0.55);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(60, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 300;
    const d = 90;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 5. Grid Helper
    const grid = new THREE.GridHelper(300, 300, 0x4f46e5, 0x1f273d);
    grid.position.y = -0.01;
    scene.add(grid);

    // 6. Raycaster for clicking & Orbit interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isPointerDown = false;
    let pointerButton = 0;
    let startX = 0;
    let startY = 0;
    let didDrag = false;

    const onPointerDown = (e: MouseEvent) => {
      isPointerDown = true;
      pointerButton = e.button;
      startX = e.clientX;
      startY = e.clientY;
      didDrag = false;
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDrag = true;
      }

      const isPanning = pointerButton === 2 || pointerButton === 1 || (pointerButton === 0 && e.shiftKey);

      if (isPanning) {
        // Pan Target
        const panSpeed = 0.04 * (cameraStateRef.current.distance / 40);
        const camRight = new THREE.Vector3();
        const camUp = new THREE.Vector3();
        camera.matrix.extractBasis(camRight, camUp, new THREE.Vector3());

        cameraStateRef.current.target.addScaledVector(camRight, -dx * panSpeed);
        cameraStateRef.current.target.addScaledVector(camUp, dy * panSpeed);
        updateCameraPosition();
      } else if (pointerButton === 0) {
        // Orbit Rotate
        const rotSpeed = 0.008;
        cameraStateRef.current.azimuth -= dx * rotSpeed;
        cameraStateRef.current.polar = Math.max(
          0.05,
          Math.min(Math.PI / 2.05, cameraStateRef.current.polar - dy * rotSpeed)
        );
        updateCameraPosition();
      }

      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerUp = (e: MouseEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;

      // Handle 3D Part Click Selection if not dragged
      if (!didDrag && pointerButton === 0) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const meshes: THREE.Object3D[] = Array.from(partMeshesRef.current.values());
        const intersects = raycaster.intersectObjects(meshes, true);

        if (intersects.length > 0) {
          // Find clicked part ID
          let hitObj: THREE.Object3D | null = intersects[0].object;
          let hitPartId: string | null = null;

          while (hitObj) {
            if (hitObj.userData && hitObj.userData.partId) {
              hitPartId = hitObj.userData.partId;
              break;
            }
            hitObj = hitObj.parent;
          }

          if (hitPartId) {
            sounds.playClick();
            setSelectedPartId(hitPartId);
          }
        } else {
          // Clicked empty space
          setSelectedPartId(null);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      cameraStateRef.current.distance = Math.max(
        4,
        Math.min(350, cameraStateRef.current.distance * zoomFactor)
      );
      updateCameraPosition();
    };

    const preventContext = (e: MouseEvent) => e.preventDefault();

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('contextmenu', preventContext);

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 8. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('contextmenu', preventContext);
      renderer.dispose();
      scene.clear();
      partMeshesRef.current.clear();
    };
  }, [updateCameraPosition]);

  // Synchronize 3D Meshes with currentPlace.parts
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const existingMap = partMeshesRef.current;
    const incomingIds = new Set(currentPlace.parts.map(p => p.id));

    // Remove meshes no longer in currentPlace
    existingMap.forEach((mesh, id) => {
      if (!incomingIds.has(id)) {
        scene.remove(mesh);
        existingMap.delete(id);
      }
    });

    // Create or update meshes
    currentPlace.parts.forEach(part => {
      const existingMesh = existingMap.get(part.id);
      if (existingMesh) {
        // Update position and rotation
        existingMesh.position.set(part.position[0], part.position[1], part.position[2]);
        existingMesh.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2]);
      } else {
        const mesh = MeshFactory.createPartMesh(part);
        (mesh as any).userData = { partId: part.id };
        scene.add(mesh);
        existingMap.set(part.id, mesh);
      }
    });

    // Update or re-attach selection outline
    if (selectionBoxRef.current) {
      scene.remove(selectionBoxRef.current);
      selectionBoxRef.current.dispose();
      selectionBoxRef.current = null;
    }

    if (selectedPartId) {
      const selMesh = existingMap.get(selectedPartId);
      if (selMesh) {
        const box = new THREE.BoxHelper(selMesh, 0x00f0ff);
        selectionBoxRef.current = box;
        scene.add(box);
      }
    }
  }, [currentPlace.parts, selectedPartId]);

  // Focus Camera on Selected Part
  const handleFocusSelected = () => {
    if (!selectedPart) return;
    sounds.playClick();
    cameraStateRef.current.target.set(
      selectedPart.position[0],
      selectedPart.position[1] + selectedPart.size[1] / 2,
      selectedPart.position[2]
    );
    cameraStateRef.current.distance = Math.max(8, Math.max(...selectedPart.size) * 3);
    updateCameraPosition();
  };

  // Camera Presets
  const handleSetCameraView = (view: 'top' | 'iso' | 'reset') => {
    sounds.playClick();
    if (view === 'top') {
      cameraStateRef.current.azimuth = 0;
      cameraStateRef.current.polar = 0.05;
      cameraStateRef.current.distance = 70;
      cameraStateRef.current.target.set(0, 0, 0);
    } else if (view === 'iso') {
      cameraStateRef.current.azimuth = Math.PI / 4;
      cameraStateRef.current.polar = Math.PI / 3.2;
      cameraStateRef.current.distance = 45;
      cameraStateRef.current.target.set(0, 2, 0);
    } else {
      cameraStateRef.current.azimuth = Math.PI / 4;
      cameraStateRef.current.polar = Math.PI / 3;
      cameraStateRef.current.distance = 45;
      cameraStateRef.current.target.set(0, 2, 0);
    }
    updateCameraPosition();
  };

  // Save place to localStorage & remix service
  const handleSavePlace = () => {
    sounds.playClick();
    const updated = {
      ...currentPlace,
      pythonCode: scriptCode,
      updatedAt: Date.now(),
    };
    setCurrentPlace(updated);
    try {
      localStorage.setItem('verlex_studio_saved_place', JSON.stringify(updated));
      localStorage.setItem('verlex_active_custom_place', JSON.stringify(updated));
      if (updated.remixInfo.isRemix) {
        remixService.savePlace(updated);
      }
    } catch (e) {}
    setSaveStatus('Place Saved Successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Launch In-Game 3D Playtest (Loads exact studio world)
  const handlePlaytestInGame = () => {
    sounds.playClick();
    const updated: RemixedPlace = {
      ...currentPlace,
      pythonCode: scriptCode,
      updatedAt: Date.now(),
    };
    setCurrentPlace(updated);
    try {
      localStorage.setItem('verlex_studio_saved_place', JSON.stringify(updated));
      localStorage.setItem('verlex_active_custom_place', JSON.stringify(updated));
      remixService.savePlace(updated);
    } catch (e) {}

    onLaunchGame('studio_map', updated);
  };

  // Add Part
  const handleAddPart = (shape: PartShape, name: string = 'NewPart', color: string = '#3498db') => {
    sounds.playClick();
    const newPart: PartData = {
      id: `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      shape,
      position: [0, 4, 0],
      size: shape === 'spawn' ? [6, 0.4, 6] : [4, 4, 4],
      rotation: [0, 0, 0],
      color,
      material: shape === 'spawn' ? 'plastic' : 'plastic',
      surfaceType: shape === 'spawn' ? 'smooth' : 'studs',
      anchored: true,
      canCollide: true,
      transparency: 0,
      reflectance: 0,
    };

    setCurrentPlace(prev => ({
      ...prev,
      parts: [...prev.parts, newPart]
    }));
    setSelectedPartId(newPart.id);
  };

  // Duplicate Selected Part
  const handleDuplicatePart = () => {
    if (!selectedPart) return;
    sounds.playClick();
    const dup: PartData = {
      ...selectedPart,
      id: `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: `${selectedPart.name}_Copy`,
      position: [
        selectedPart.position[0] + gridSnap * 2,
        selectedPart.position[1],
        selectedPart.position[2] + gridSnap * 2
      ]
    };

    setCurrentPlace(prev => ({
      ...prev,
      parts: [...prev.parts, dup]
    }));
    setSelectedPartId(dup.id);
  };

  // Delete Part
  const handleDeletePart = (id: string) => {
    sounds.playClick();
    setCurrentPlace(prev => ({
      ...prev,
      parts: prev.parts.filter(p => p.id !== id)
    }));
    if (selectedPartId === id) {
      setSelectedPartId(null);
    }
  };

  // Update Part Properties
  const handleUpdatePart = (updated: Partial<PartData>) => {
    if (!selectedPartId) return;
    setCurrentPlace(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.id === selectedPartId ? { ...p, ...updated } : p)
    }));
  };

  // Nudge Part along axis
  const handleNudgePart = (axis: 'x' | 'y' | 'z', delta: number) => {
    if (!selectedPart) return;
    sounds.playClick();
    const newPos: [number, number, number] = [
      selectedPart.position[0],
      selectedPart.position[1],
      selectedPart.position[2]
    ];
    if (axis === 'x') newPos[0] = Math.round((newPos[0] + delta) * 10) / 10;
    if (axis === 'y') newPos[1] = Math.max(0, Math.round((newPos[1] + delta) * 10) / 10);
    if (axis === 'z') newPos[2] = Math.round((newPos[2] + delta) * 10) / 10;

    handleUpdatePart({ position: newPos });
  };

  // Drop part to ground
  const handleGroundPart = () => {
    if (!selectedPart) return;
    sounds.playClick();
    const newPos: [number, number, number] = [
      selectedPart.position[0],
      selectedPart.size[1] / 2,
      selectedPart.position[2]
    ];
    handleUpdatePart({ position: newPos });
  };

  // Execute Script
  const handleRunScript = () => {
    sounds.playClick();
    setSimulationState('simulating');
    const logs = ['> Running script via Verlex Engine VM...'];
    const lines = scriptCode.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('print(')) {
        const msg = trimmed.match(/print\((.*)\)/)?.[1]?.replace(/['"]/g, '') || '';
        logs.push(`[Output] ${msg}`);
      } else if (trimmed.includes('verlex.create_block')) {
        logs.push(`[Server] Dynamic part instantiated from script.`);
      }
    });

    setConsoleLogs(logs);
  };

  // Insert Toolbox Asset
  const handleInsertToolboxAsset = (assetType: string) => {
    sounds.playClick();
    if (assetType === 'tower') {
      for (let i = 0; i < 5; i++) {
        handleAddPart('block', `TowerBlock_${i}`, i % 2 === 0 ? '#e74c3c' : '#f1c40f');
      }
      setConsoleLogs(prev => [...prev, '[Toolbox] Inserted Brick Tower Model into Workspace']);
    } else if (assetType === 'trampoline') {
      handleAddPart('trampoline', 'BouncePad', '#00ff88');
      setConsoleLogs(prev => [...prev, '[Toolbox] Inserted Super Bounce Trampoline']);
    } else if (assetType === 'tnt') {
      handleAddPart('tnt', 'ExplosiveTNT', '#e74c3c');
      setConsoleLogs(prev => [...prev, '[Toolbox] Inserted TNT Explosive Crate']);
    } else if (assetType === 'script_leaderstats') {
      const codeToAdd = `\n# Leaderstats Script\ndef on_player_join(player):\n    player.leaderstats.coins = 100\n    print(f"Granted 100 V$ to {player.name}")\n`;
      setScriptCode(prev => prev + codeToAdd);
      setConsoleLogs(prev => [...prev, '[Toolbox] Added Leaderstats Script to ServerScriptService']);
    }
  };

  return (
    <div id="verlex-studio-root" className="w-full h-[calc(100vh-140px)] bg-[#10121a] flex flex-col font-sans select-none overflow-hidden text-xs text-gray-200">
      
      {/* 1. TOP RIBBON TOOLBAR */}
      <div className="bg-[#181c29] border-b border-[#293042] flex flex-col">
        {/* Ribbon Tabs */}
        <div className="flex items-center justify-between px-3 bg-[#12141e] border-b border-[#22283a]">
          <div className="flex space-x-1">
            <span className="px-3 py-1.5 font-black text-amber-400 text-xs flex items-center space-x-1 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>VERLEX STUDIO FULL</span>
            </span>

            {(['home', 'model', 'test', 'view', 'script'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  sounds.playClick();
                  setRibbonTab(tab);
                }}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-colors cursor-pointer ${
                  ribbonTab === tab
                    ? 'border-indigo-400 text-white bg-[#181c29]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 py-1">
            {saveStatus && (
              <span className="text-[11px] font-bold text-emerald-400 animate-pulse flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveStatus}</span>
              </span>
            )}

            <button
              onClick={() => setIsNetworkModalOpen(true)}
              className="px-2.5 py-1 bg-[#22283a] hover:bg-[#2e364e] text-indigo-300 font-bold text-[11px] rounded border border-[#3b4563] flex items-center space-x-1 cursor-pointer"
              title="Open Network Topology Settings"
            >
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              <span>Network Topology</span>
            </button>

            <button
              onClick={handleSavePlace}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded border border-indigo-400 flex items-center space-x-1 cursor-pointer shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Place</span>
            </button>
          </div>
        </div>

        {/* Ribbon Sub-Toolbar */}
        <div className="p-2 flex flex-wrap items-center justify-between gap-2 bg-[#181c29]">
          
          {/* Tools & Parts Insertion */}
          <div className="flex items-center space-x-3">
            {/* Transform Mode */}
            <div className="flex items-center space-x-1 bg-[#12141e] p-1 rounded border border-[#293042]">
              <button
                onClick={() => setActiveTool('select')}
                className={`p-1.5 rounded cursor-pointer ${activeTool === 'select' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Select Tool"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTool('move')}
                className={`p-1.5 rounded cursor-pointer ${activeTool === 'move' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Move Tool"
              >
                <Move className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTool('rotate')}
                className={`p-1.5 rounded cursor-pointer ${activeTool === 'rotate' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Rotate Tool"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTool('scale')}
                className={`p-1.5 rounded cursor-pointer ${activeTool === 'scale' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Scale Tool"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Snap Selector */}
            <div className="flex items-center space-x-1 bg-[#12141e] px-2 py-1 rounded border border-[#293042]">
              <span className="text-[10px] text-gray-400 font-bold">Snap:</span>
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setGridSnap(s)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${gridSnap === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {s}s
                </button>
              ))}
            </div>

            {/* Part Inserter Quick Dropdown */}
            <div className="flex items-center space-x-1 border-l border-[#293042] pl-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Insert:</span>
              {(['block', 'wedge', 'cylinder', 'sphere', 'spawn', 'trampoline', 'tnt'] as const).map(shape => (
                <button
                  key={shape}
                  onClick={() => handleAddPart(shape, `${shape.toUpperCase()}_Part`)}
                  className="px-2 py-1 bg-[#222838] hover:bg-indigo-600 hover:text-white text-gray-300 font-bold text-[10px] rounded border border-[#2e374d] capitalize transition-colors cursor-pointer"
                >
                  +{shape}
                </button>
              ))}
            </div>
          </div>

          {/* Playtest Controls */}
          <div className="flex items-center space-x-2">
            {simulationState === 'edit' ? (
              <button
                onClick={handleRunScript}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs rounded border border-indigo-400 shadow cursor-pointer flex items-center space-x-1"
                title="Run Script / Simulation in Viewport"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Run Sim</span>
              </button>
            ) : (
              <button
                onClick={() => setSimulationState('edit')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded border border-red-400 shadow cursor-pointer flex items-center space-x-1"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop</span>
              </button>
            )}

            {/* Playtest In Real 3D Multiplayer Game */}
            <button
              onClick={handlePlaytestInGame}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded border border-emerald-400 shadow cursor-pointer flex items-center space-x-1.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Playtest in 3D</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STUDIO WORKSPACE PANELS */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: EXPLORER TREE */}
        <div className="w-64 bg-[#141721] border-r border-[#293042] flex flex-col select-none">
          <div className="bg-[#1a1e2b] px-3 py-2 border-b border-[#293042] flex items-center justify-between font-bold text-xs">
            <span className="flex items-center space-x-1.5 text-indigo-300">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>Explorer</span>
            </span>
            <span className="text-[10px] text-gray-400">{currentPlace.parts.length} Objects</span>
          </div>

          <div className="flex-1 p-2 overflow-y-auto space-y-1 font-mono text-[11px] custom-scrollbar">
            {/* Workspace Root */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-amber-300 font-bold py-0.5">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>Workspace ({currentPlace.title})</span>
              </div>

              {/* Workspace Children */}
              <div className="pl-4 space-y-0.5">
                {currentPlace.parts.map(part => (
                  <button
                    key={part.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedPartId(part.id);
                    }}
                    className={`w-full text-left px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                      selectedPartId === part.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-gray-300 hover:bg-[#1e2333]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <Box className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{part.name}</span>
                    </div>
                    {selectedPartId === part.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePart(part.id);
                        }}
                        className="text-red-300 hover:text-white p-0.5"
                        title="Delete part"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Other Roblox Services Nodes */}
            <div className="pt-2 border-t border-[#252a3a] space-y-1 text-gray-400">
              <div className="flex items-center space-x-1 py-0.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Lighting</span>
              </div>
              <div className="flex items-center space-x-1 py-0.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>ServerScriptService</span>
              </div>
              <div className="flex items-center space-x-1 py-0.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>StarterGui</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: 3D INTERACTIVE VIEWPORT & SCRIPT EDITOR */}
        <div className="flex-1 flex flex-col bg-[#0b0c14] relative">
          
          {/* Viewport Header Bar */}
          <div className="bg-[#141721] px-3 py-1.5 border-b border-[#293042] flex items-center justify-between text-xs font-bold text-gray-300 z-10">
            <div className="flex items-center space-x-2">
              <span className="text-white flex items-center space-x-1">
                <Grid className="w-3.5 h-3.5 text-indigo-400" />
                <span>Interactive 3D Viewport</span>
              </span>
              {currentPlace.remixInfo.isRemix && (
                <span className="bg-amber-950 text-amber-300 border border-amber-600 text-[10px] px-2 py-0.5 rounded font-black">
                  REMIXED FROM {currentPlace.remixInfo.originalTitle}
                </span>
              )}
            </div>

            {/* Viewport Camera Preset Controls */}
            <div className="flex items-center space-x-1.5 text-[10px]">
              <button
                onClick={handleFocusSelected}
                disabled={!selectedPart}
                className="px-2 py-0.5 bg-[#1e2436] hover:bg-indigo-600 disabled:opacity-40 text-gray-200 rounded border border-[#2d3752] flex items-center space-x-1 cursor-pointer"
                title="Focus Camera on Selected Part [F]"
              >
                <Focus className="w-3 h-3 text-cyan-400" />
                <span>Focus</span>
              </button>

              <button
                onClick={() => handleSetCameraView('iso')}
                className="px-2 py-0.5 bg-[#1e2436] hover:bg-indigo-600 text-gray-200 rounded border border-[#2d3752] flex items-center space-x-1 cursor-pointer"
                title="Isometric 3D Angle"
              >
                <Compass className="w-3 h-3 text-indigo-400" />
                <span>Iso 3D</span>
              </button>

              <button
                onClick={() => handleSetCameraView('top')}
                className="px-2 py-0.5 bg-[#1e2436] hover:bg-indigo-600 text-gray-200 rounded border border-[#2d3752] flex items-center space-x-1 cursor-pointer"
                title="Top-Down View"
              >
                <span>Top</span>
              </button>

              <button
                onClick={() => handleSetCameraView('reset')}
                className="px-2 py-0.5 bg-[#1e2436] hover:bg-indigo-600 text-gray-200 rounded border border-[#2d3752] flex items-center space-x-1 cursor-pointer"
                title="Reset Camera"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* REAL THREE.JS 3D CANVAS VIEWPORT */}
          <div className="flex-1 relative overflow-hidden bg-[#0e111a]">
            {/* Interactive Three.js Mount Container */}
            <div 
              ref={viewportContainerRef} 
              className="w-full h-full cursor-grab active:cursor-grabbing outline-none" 
            />

            {/* Overlaid Viewport Info & Tool Helper */}
            <div className="absolute top-3 left-3 pointer-events-none space-y-1">
              <div className="bg-[#121624]/85 backdrop-blur px-2.5 py-1.5 rounded-lg border border-[#29324a] text-[11px] shadow-lg text-gray-300">
                <span className="font-extrabold text-white">{currentPlace.title}</span>
                <span className="text-[10px] text-gray-400 block font-mono">
                  {currentPlace.parts.length} parts &bull; Snap: {gridSnap} stud &bull; Tool: {activeTool.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Floating Selection Quick-Nudge Transform Bar */}
            {selectedPart && (
              <div className="absolute bottom-3 left-3 bg-[#121624]/90 backdrop-blur p-2 rounded-lg border border-indigo-500/60 shadow-2xl flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center space-x-1.5 border-r border-[#2a344d] pr-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedPart.color }} />
                  <span className="font-extrabold text-white truncate max-w-[120px]">{selectedPart.name}</span>
                </div>

                {/* Quick Nudge Buttons */}
                <div className="flex items-center space-x-1 font-mono text-[10px]">
                  <span className="text-gray-400 font-bold">X:</span>
                  <button onClick={() => handleNudgePart('x', -gridSnap)} className="px-1.5 py-0.5 bg-[#1e2538] hover:bg-indigo-600 rounded text-white border border-[#2f3954] cursor-pointer">-</button>
                  <button onClick={() => handleNudgePart('x', gridSnap)} className="px-1.5 py-0.5 bg-[#1e2538] hover:bg-indigo-600 rounded text-white border border-[#2f3954] cursor-pointer">+</button>

                  <span className="text-gray-400 font-bold ml-1">Y:</span>
                  <button onClick={() => handleNudgePart('y', -gridSnap)} className="px-1.5 py-0.5 bg-[#1e2538] hover:bg-indigo-600 rounded text-white border border-[#2f3954] cursor-pointer">-</button>
                  <button onClick={() => handleNudgePart('y', gridSnap)} className="px-1.5 py-0.5 bg-[#1e2538] hover:bg-indigo-600 rounded text-white border border-[#2f3954] cursor-pointer">+</button>

                  <span className="text-gray-400 font-bold ml-1">Z:</span>
                  <button onClick={() => handleNudgePart('z', -gridSnap)} className="px-1.5 py-0.5 bg-[#1e2538] hover:bg-indigo-600 rounded text-white border border-[#2f3954] cursor-pointer">-</button>
                  <button onClick={() => handleNudgePart('z', gridSnap)} className="px-1.5 py-0.5 bg-[#1e2538] hover:bg-indigo-600 rounded text-white border border-[#2f3954] cursor-pointer">+</button>
                </div>

                {/* Ground, Duplicate & Delete */}
                <div className="flex items-center space-x-1 border-l border-[#2a344d] pl-2">
                  <button
                    onClick={handleGroundPart}
                    className="px-2 py-0.5 bg-[#1e2538] hover:bg-indigo-600 rounded text-gray-300 hover:text-white border border-[#2f3954] text-[10px] font-bold cursor-pointer"
                    title="Drop to ground level"
                  >
                    Ground
                  </button>
                  <button
                    onClick={handleDuplicatePart}
                    className="px-2 py-0.5 bg-indigo-700 hover:bg-indigo-600 rounded text-white border border-indigo-500 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                    title="Duplicate Part"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Dup</span>
                  </button>
                  <button
                    onClick={() => handleDeletePart(selectedPart.id)}
                    className="p-1 bg-red-900/60 hover:bg-red-600 text-red-200 hover:text-white rounded border border-red-700 cursor-pointer"
                    title="Delete Part"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Playtest Banner on Viewport */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <button
                onClick={handlePlaytestInGame}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-lg shadow-xl cursor-pointer flex items-center space-x-1.5 border border-emerald-400 active:scale-95 transition-transform"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Test Drive In 3D Engine World</span>
              </button>
            </div>
          </div>

          {/* SCRIPT EDITOR & CONSOLE PANEL (BOTTOM) */}
          <div className="h-44 bg-[#0d0f17] border-t border-[#293042] flex flex-col">
            <div className="bg-[#141721] px-3 py-1.5 border-b border-[#293042] flex items-center justify-between text-xs font-bold text-gray-300">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>ServerScript &amp; Console Logs</span>
              </div>
              <button
                onClick={handleRunScript}
                className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                Execute Script
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Script Editor Code */}
              <div className="w-1/2 border-r border-[#242b3d] p-2 bg-[#0a0b12]">
                <textarea
                  value={scriptCode}
                  onChange={(e) => setScriptCode(e.target.value)}
                  className="w-full h-full bg-transparent font-mono text-[11px] text-emerald-300 focus:outline-none resize-none custom-scrollbar"
                  placeholder="Write Verlex Python/Luau server scripts here..."
                />
              </div>

              {/* Console Logs */}
              <div className="w-1/2 p-2 bg-[#0a0b12] font-mono text-[11px] text-gray-300 overflow-y-auto space-y-1 custom-scrollbar">
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className={log.startsWith('[Output]') ? 'text-cyan-300' : 'text-gray-400'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: PROPERTIES INSPECTOR & TOOLBOX */}
        <div className="w-72 bg-[#141721] border-l border-[#293042] flex flex-col select-none">
          
          {/* Header */}
          <div className="bg-[#1a1e2b] px-3 py-2 border-b border-[#293042] flex items-center justify-between font-bold text-xs">
            <span className="flex items-center space-x-1.5 text-indigo-300">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Properties Inspector</span>
            </span>
          </div>

          {/* Properties Form */}
          <div className="flex-1 p-3 overflow-y-auto space-y-4 custom-scrollbar">
            {selectedPart ? (
              <div className="space-y-3">
                {/* Part Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Part Name</label>
                  <input
                    type="text"
                    value={selectedPart.name}
                    onChange={(e) => handleUpdatePart({ name: e.target.value })}
                    className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-2.5 py-1 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Position [X, Y, Z] */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Position (Studs)</label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-red-400 block font-bold">X</span>
                      <input
                        type="number"
                        value={selectedPart.position[0]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const pos: [number, number, number] = [val, selectedPart.position[1], selectedPart.position[2]];
                          handleUpdatePart({ position: pos });
                        }}
                        className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-1.5 py-1 text-white text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-400 block font-bold">Y</span>
                      <input
                        type="number"
                        value={selectedPart.position[1]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const pos: [number, number, number] = [selectedPart.position[0], val, selectedPart.position[2]];
                          handleUpdatePart({ position: pos });
                        }}
                        className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-1.5 py-1 text-white text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-blue-400 block font-bold">Z</span>
                      <input
                        type="number"
                        value={selectedPart.position[2]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const pos: [number, number, number] = [selectedPart.position[0], selectedPart.position[1], val];
                          handleUpdatePart({ position: pos });
                        }}
                        className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-1.5 py-1 text-white text-center focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Size [X, Y, Z] */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Size (Width, Height, Depth)</label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold">W</span>
                      <input
                        type="number"
                        min="0.2"
                        step="0.5"
                        value={selectedPart.size[0]}
                        onChange={(e) => {
                          const val = Math.max(0.2, parseFloat(e.target.value) || 1);
                          const sz: [number, number, number] = [val, selectedPart.size[1], selectedPart.size[2]];
                          handleUpdatePart({ size: sz });
                        }}
                        className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-1.5 py-1 text-white text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold">H</span>
                      <input
                        type="number"
                        min="0.2"
                        step="0.5"
                        value={selectedPart.size[1]}
                        onChange={(e) => {
                          const val = Math.max(0.2, parseFloat(e.target.value) || 1);
                          const sz: [number, number, number] = [selectedPart.size[0], val, selectedPart.size[2]];
                          handleUpdatePart({ size: sz });
                        }}
                        className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-1.5 py-1 text-white text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold">D</span>
                      <input
                        type="number"
                        min="0.2"
                        step="0.5"
                        value={selectedPart.size[2]}
                        onChange={(e) => {
                          const val = Math.max(0.2, parseFloat(e.target.value) || 1);
                          const sz: [number, number, number] = [selectedPart.size[0], selectedPart.size[1], val];
                          handleUpdatePart({ size: sz });
                        }}
                        className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-1.5 py-1 text-white text-center focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Brick Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedPart.color}
                      onChange={(e) => handleUpdatePart({ color: e.target.value })}
                      className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedPart.color}
                      onChange={(e) => handleUpdatePart({ color: e.target.value })}
                      className="flex-1 bg-[#1b202e] border border-[#2e374d] rounded px-2 py-1 font-mono text-xs text-white uppercase"
                    />
                  </div>
                </div>

                {/* Material Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Material</label>
                  <select
                    value={selectedPart.material}
                    onChange={(e) => handleUpdatePart({ material: e.target.value as PartMaterial })}
                    className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-2 py-1 text-xs text-white focus:outline-none capitalize"
                  >
                    {['plastic', 'smooth', 'neon', 'wood', 'metal', 'glass', 'ice', 'forcefield'].map(mat => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>

                {/* Surface Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Surface Type</label>
                  <select
                    value={selectedPart.surfaceType}
                    onChange={(e) => handleUpdatePart({ surfaceType: e.target.value as SurfaceType })}
                    className="w-full bg-[#1b202e] border border-[#2e374d] rounded px-2 py-1 text-xs text-white focus:outline-none capitalize"
                  >
                    {['studs', 'inlets', 'smooth', 'weld', 'glue'].map(surf => (
                      <option key={surf} value={surf}>{surf}</option>
                    ))}
                  </select>
                </div>

                {/* Anchored & CanCollide Checkboxes */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center space-x-2 bg-[#1b202e] p-2 rounded border border-[#2e374d] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPart.anchored}
                      onChange={(e) => handleUpdatePart({ anchored: e.target.checked })}
                      className="accent-indigo-500 cursor-pointer"
                    />
                    <span className="font-bold text-white text-[11px]">Anchored</span>
                  </label>

                  <label className="flex items-center space-x-2 bg-[#1b202e] p-2 rounded border border-[#2e374d] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPart.canCollide}
                      onChange={(e) => handleUpdatePart({ canCollide: e.target.checked })}
                      className="accent-indigo-500 cursor-pointer"
                    />
                    <span className="font-bold text-white text-[11px]">CanCollide</span>
                  </label>
                </div>

                {/* Transparency Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>Transparency</span>
                    <span>{selectedPart.transparency.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedPart.transparency}
                    onChange={(e) => handleUpdatePart({ transparency: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Click any part in the 3D Viewport or Explorer tree to inspect properties.
              </div>
            )}

            {/* TOOLBOX ASSETS DRAWER */}
            <div className="pt-4 border-t border-[#293042] space-y-3">
              <div className="flex items-center justify-between font-bold text-xs text-indigo-300">
                <span className="flex items-center space-x-1">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span>Toolbox Asset Store</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleInsertToolboxAsset('tower')}
                  className="p-2 bg-[#1b202e] hover:bg-indigo-900 border border-[#2e374d] rounded text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white block">🧱 Brick Tower</span>
                  <span className="text-[10px] text-gray-400">5-Layer Stacking Tower</span>
                </button>

                <button
                  onClick={() => handleInsertToolboxAsset('trampoline')}
                  className="p-2 bg-[#1b202e] hover:bg-indigo-900 border border-[#2e374d] rounded text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-emerald-400 block">🟢 Bounce Pad</span>
                  <span className="text-[10px] text-gray-400">Super Jump Trampoline</span>
                </button>

                <button
                  onClick={() => handleInsertToolboxAsset('tnt')}
                  className="p-2 bg-[#1b202e] hover:bg-indigo-900 border border-[#2e374d] rounded text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-red-400 block">💣 TNT Crate</span>
                  <span className="text-[10px] text-gray-400">Explosive Physics Block</span>
                </button>

                <button
                  onClick={() => handleInsertToolboxAsset('script_leaderstats')}
                  className="p-2 bg-[#1b202e] hover:bg-indigo-900 border border-[#2e374d] rounded text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-amber-400 block">📜 Leaderstats</span>
                  <span className="text-[10px] text-gray-400">V$ Currency Script</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Network Topology Modal */}
      <NetworkTopologyModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
      />

    </div>
  );
};
