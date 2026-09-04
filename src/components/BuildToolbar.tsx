import React from 'react';
import { PartMaterial, PartShape, SurfaceType } from '../types';
import { RotateCw, Lock, Unlock, Box } from 'lucide-react';

interface BuildToolbarProps {
  shape: PartShape;
  onShapeChange: (shape: PartShape) => void;
  color: string;
  onColorChange: (color: string) => void;
  material: PartMaterial;
  onMaterialChange: (material: PartMaterial) => void;
  surfaceType: SurfaceType;
  onSurfaceTypeChange: (surface: SurfaceType) => void;
  size: [number, number, number];
  onSizeChange: (size: [number, number, number]) => void;
  anchored: boolean;
  onAnchoredChange: (anchored: boolean) => void;
  gridSnap: number;
  onGridSnapChange: (snap: number) => void;
  onRotate: () => void;
}

export const BuildToolbar: React.FC<BuildToolbarProps> = ({
  shape,
  onShapeChange,
  color,
  onColorChange,
  material,
  onMaterialChange,
  surfaceType,
  onSurfaceTypeChange,
  size,
  onSizeChange,
  anchored,
  onAnchoredChange,
  gridSnap,
  onGridSnapChange,
  onRotate,
}) => {
  const shapes: { id: PartShape; label: string; icon: string }[] = [
    { id: 'block', label: 'Brick', icon: '🧱' },
    { id: 'wedge', label: 'Wedge', icon: '📐' },
    { id: 'cylinder', label: 'Cylinder', icon: '🛢️' },
    { id: 'sphere', label: 'Ball', icon: '⚽' },
    { id: 'truss', label: 'Truss', icon: '🪜' },
    { id: 'trampoline', label: 'Bouncy', icon: '🟢' },
    { id: 'conveyor', label: 'Conveyor', icon: '⏩' },
    { id: 'tnt', label: 'TNT', icon: '💥' },
    { id: 'spawn', label: 'Spawn', icon: '⭐' },
    { id: 'dummy', label: 'Dummy NPC', icon: '👤' },
  ];

  const verlexColors = [
    { hex: '#e74c3c', name: 'Bright Red' },
    { hex: '#3498db', name: 'Bright Blue' },
    { hex: '#f1c40f', name: 'Bright Yellow' },
    { hex: '#2ecc71', name: 'Lime Green' },
    { hex: '#e67e22', name: 'Bright Orange' },
    { hex: '#9b59b6', name: 'Royal Purple' },
    { hex: '#95a5a6', name: 'Med Stone Grey' },
    { hex: '#111111', name: 'Really Black' },
    { hex: '#ffffff', name: 'White' },
    { hex: '#00d2ff', name: 'Cyan' },
    { hex: '#795548', name: 'Reddish Brown' },
    { hex: '#ffd700', name: 'Gold' },
  ];

  const materials: { id: PartMaterial; label: string }[] = [
    { id: 'plastic', label: 'Plastic' },
    { id: 'smooth', label: 'Smooth' },
    { id: 'neon', label: 'Neon' },
    { id: 'wood', label: 'Wood' },
    { id: 'metal', label: 'Metal' },
    { id: 'glass', label: 'Glass' },
    { id: 'ice', label: 'Ice' },
  ];

  const surfaces: { id: SurfaceType; label: string }[] = [
    { id: 'studs', label: 'Studs' },
    { id: 'inlets', label: 'Inlets' },
    { id: 'smooth', label: 'Smooth' },
    { id: 'weld', label: 'Weld' },
    { id: 'glue', label: 'Glue' },
  ];

  const presetSizes: { label: string; size: [number, number, number] }[] = [
    { label: '2x1x2', size: [2, 1, 2] },
    { label: '4x2x4', size: [4, 2, 4] },
    { label: '4x1x2 (Brick)', size: [4, 1, 2] },
    { label: '8x1x8 (Plate)', size: [8, 1, 8] },
    { label: '1x5x1 (Post)', size: [1, 5, 1] },
    { label: '4x5x1 (Dummy)', size: [4, 5, 1] },
    { label: '16x2x16 (Floor)', size: [16, 2, 16] },
  ];

  return (
    <aside
      aria-label="Build Toolbar"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-16 left-2 sm:left-4 z-20 w-64 sm:w-80 roblox-bevel-box p-3 text-white select-none max-h-[calc(100vh-130px)] overflow-y-auto custom-scrollbar"
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-700">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-400">
          <Box className="w-4 h-4 text-amber-400" />
          <span>Stud Builder Toolbar</span>
        </div>
        <button
          onClick={onRotate}
          className="roblox-btn roblox-btn-classic px-2 py-1 text-[10px] gap-1"
          title="Rotate Part (R Key)"
        >
          <RotateCw className="w-3 h-3" />
          <span>Rotate (R)</span>
        </button>
      </div>

      {/* Part Shape Selection */}
      <div className="mb-3">
        <label className="text-[11px] font-bold text-amber-300 block mb-1">
          Part Shape
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {shapes.map((s) => (
            <button
              key={s.id}
              onClick={() => onShapeChange(s.id)}
              className={`roblox-btn px-2 py-1 text-xs gap-1 ${
                shape === s.id
                  ? 'roblox-btn-gold font-bold'
                  : 'roblox-btn-classic text-neutral-200'
              }`}
            >
              <span>{s.icon}</span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brick Colors */}
      <div className="mb-3">
        <label className="text-[11px] font-bold text-amber-300 block mb-1">
          Brick Color
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {verlexColors.map((c) => (
            <button
              key={c.hex}
              onClick={() => onColorChange(c.hex)}
              className={`w-full aspect-square rounded border-2 transition transform ${
                color.toLowerCase() === c.hex.toLowerCase()
                  ? 'border-white ring-2 ring-amber-400 scale-105'
                  : 'border-neutral-900 hover:border-neutral-500'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Material & Surface */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[11px] font-bold text-amber-300 block mb-1">
            Material
          </label>
          <select
            value={material}
            onChange={(e) => onMaterialChange(e.target.value as PartMaterial)}
            className="w-full roblox-chat-input text-xs"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-amber-300 block mb-1">
            Top Surface
          </label>
          <select
            value={surfaceType}
            onChange={(e) => onSurfaceTypeChange(e.target.value as SurfaceType)}
            className="w-full roblox-chat-input text-xs"
          >
            {surfaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Sizes */}
      <div className="mb-3">
        <label className="text-[11px] font-bold text-amber-300 block mb-1">
          Stud Dimensions ({size[0]} x {size[1]} x {size[2]})
        </label>
        <div className="grid grid-cols-3 gap-1 mb-2">
          {presetSizes.map((ps) => (
            <button
              key={ps.label}
              onClick={() => onSizeChange(ps.size)}
              className={`roblox-btn px-1.5 py-1 text-[10px] font-mono ${
                size[0] === ps.size[0] && size[1] === ps.size[1] && size[2] === ps.size[2]
                  ? 'roblox-btn-gold font-bold'
                  : 'roblox-btn-classic text-neutral-300'
              }`}
            >
              {ps.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="flex gap-2">
          <div className="flex-1">
            <span className="text-[10px] text-neutral-400 block">W: {size[0]}</span>
            <input
              type="range"
              min="1"
              max="32"
              value={size[0]}
              onChange={(e) => onSizeChange([parseInt(e.target.value), size[1], size[2]])}
              className="w-full accent-amber-500"
            />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-neutral-400 block">H: {size[1]}</span>
            <input
              type="range"
              min="1"
              max="32"
              value={size[1]}
              onChange={(e) => onSizeChange([size[0], parseInt(e.target.value), size[2]])}
              className="w-full accent-amber-500"
            />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-neutral-400 block">D: {size[2]}</span>
            <input
              type="range"
              min="1"
              max="32"
              value={size[2]}
              onChange={(e) => onSizeChange([size[0], size[1], parseInt(e.target.value)])}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Physics Anchored & Grid Snap */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-700">
        <button
          onClick={() => onAnchoredChange(!anchored)}
          className={`roblox-btn px-2 py-1.5 text-xs gap-1 ${
            anchored
              ? 'roblox-btn-classic text-neutral-300'
              : 'roblox-btn-blue font-bold'
          }`}
          title={anchored ? 'Anchored (Static)' : 'Unanchored (Newtonian Physics Body)'}
        >
          {anchored ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{anchored ? 'Anchored' : 'Physics'}</span>
        </button>

        <div className="flex items-center roblox-inset-box p-0.5">
          {[1, 2, 4].map((snap) => (
            <button
              key={snap}
              onClick={() => onGridSnapChange(snap)}
              className={`flex-1 roblox-btn py-1 text-[10px] font-mono font-bold ${
                gridSnap === snap ? 'roblox-btn-gold' : 'roblox-btn-classic text-neutral-400'
              }`}
            >
              {snap}s
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
