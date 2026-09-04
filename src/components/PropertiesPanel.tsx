import React from 'react';
import { PartData, PartMaterial, SurfaceType } from '../types';
import { X, Copy, Trash2, Lock, Unlock, Sliders } from 'lucide-react';

interface PropertiesPanelProps {
  part: PartData;
  onUpdate: (updated: PartData) => void;
  onDelete: (id: string) => void;
  onDuplicate: (part: PartData) => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  part,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
}) => {
  const materials: PartMaterial[] = ['plastic', 'smooth', 'neon', 'wood', 'metal', 'glass', 'ice', 'forcefield'];
  const surfaces: SurfaceType[] = ['studs', 'inlets', 'smooth', 'weld', 'glue'];

  return (
    <aside aria-label="Properties Panel" className="absolute top-16 right-2 sm:right-4 z-20 w-60 sm:w-72 bg-neutral-900/95 backdrop-blur-md rounded-2xl border border-neutral-700/70 shadow-2xl p-4 text-white select-none max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-700">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-blue-400">
          <Sliders className="w-4 h-4" />
          <span>Properties</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Part Name & Shape */}
      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
          Part Name
        </label>
        <input
          type="text"
          value={part.name}
          onChange={(e) => onUpdate({ ...part, name: e.target.value })}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-medium"
        />
      </div>

      {/* Position (X, Y, Z) */}
      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
          Position (Studs)
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <div key={axis} className="flex items-center bg-neutral-800 rounded-lg border border-neutral-700 px-2 py-1">
              <span className="text-[10px] font-bold text-neutral-500 mr-1">{axis}:</span>
              <input
                type="number"
                step="0.5"
                value={Math.round(part.position[i] * 10) / 10}
                onChange={(e) => {
                  const newPos = [...part.position] as [number, number, number];
                  newPos[i] = parseFloat(e.target.value) || 0;
                  onUpdate({ ...part, position: newPos });
                }}
                className="w-full bg-transparent text-xs text-white outline-none font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Size (X, Y, Z) */}
      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
          Size (Studs)
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['W', 'H', 'D'] as const).map((axis, i) => (
            <div key={axis} className="flex items-center bg-neutral-800 rounded-lg border border-neutral-700 px-2 py-1">
              <span className="text-[10px] font-bold text-neutral-500 mr-1">{axis}:</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={part.size[i]}
                onChange={(e) => {
                  const newSize = [...part.size] as [number, number, number];
                  newSize[i] = Math.max(0.5, parseFloat(e.target.value) || 1);
                  onUpdate({ ...part, size: newSize });
                }}
                className="w-full bg-transparent text-xs text-white outline-none font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Brick Color */}
      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
          Brick Color
        </label>
        <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-lg p-1.5">
          <input
            type="color"
            value={part.color}
            onChange={(e) => onUpdate({ ...part, color: e.target.value })}
            className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
          />
          <span className="text-xs font-mono font-medium uppercase">{part.color}</span>
        </div>
      </div>

      {/* Material & Surface */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Material
          </label>
          <select
            value={part.material}
            onChange={(e) => onUpdate({ ...part, material: e.target.value as PartMaterial })}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
          >
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Surface
          </label>
          <select
            value={part.surfaceType}
            onChange={(e) => onUpdate({ ...part, surfaceType: e.target.value as SurfaceType })}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
          >
            {surfaces.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Physics Anchored & Collisions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onUpdate({ ...part, anchored: !part.anchored })}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold border transition ${
            part.anchored
              ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
              : 'bg-indigo-600 text-white border-indigo-400 shadow font-bold'
          }`}
        >
          {part.anchored ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{part.anchored ? 'Anchored' : 'Dynamic'}</span>
        </button>

        <button
          onClick={() => onUpdate({ ...part, canCollide: !part.canCollide })}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold border transition ${
            part.canCollide
              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
          }`}
        >
          <span>Collide: {part.canCollide ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Action Buttons: Duplicate & Delete */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-700">
        <button
          onClick={() => onDuplicate(part)}
          className="flex items-center justify-center gap-1.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition"
        >
          <Copy className="w-3.5 h-3.5 text-blue-400" />
          <span>Duplicate</span>
        </button>

        <button
          onClick={() => onDelete(part.id)}
          className="flex items-center justify-center gap-1.5 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-semibold rounded-lg border border-red-800/80 transition"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Delete</span>
        </button>
      </div>
    </aside>
  );
};
