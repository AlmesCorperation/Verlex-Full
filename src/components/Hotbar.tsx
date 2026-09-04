import React from 'react';
import { 
  MousePointer, 
  Hammer, 
  Magnet, 
  Flame, 
  Sword, 
  Paintbrush, 
  Hand, 
  Trash2 
} from 'lucide-react';
import { ToolType } from '../types';

interface HotbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({ activeTool, onSelectTool }) => {
  const tools: { id: ToolType; num: number; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'select', num: 1, name: 'Select', icon: <MousePointer className="w-5 h-5" />, color: 'text-blue-400' },
    { id: 'build', num: 2, name: 'Build', icon: <Hammer className="w-5 h-5" />, color: 'text-emerald-400' },
    { id: 'gravity', num: 3, name: 'Gravity Gun', icon: <Magnet className="w-5 h-5" />, color: 'text-cyan-400' },
    { id: 'rocket', num: 4, name: 'Rocket', icon: <Flame className="w-5 h-5" />, color: 'text-amber-400' },
    { id: 'sword', num: 5, name: 'Sword', icon: <Sword className="w-5 h-5" />, color: 'text-indigo-400' },
    { id: 'paint', num: 6, name: 'Paint', icon: <Paintbrush className="w-5 h-5" />, color: 'text-rose-400' },
    { id: 'push', num: 7, name: 'Push', icon: <Hand className="w-5 h-5" />, color: 'text-yellow-400' },
    { id: 'delete', num: 8, name: 'Delete', icon: <Trash2 className="w-5 h-5" />, color: 'text-red-400' },
  ];

  const handleSelect = (e: React.MouseEvent | React.TouchEvent, toolId: ToolType) => {
    e.stopPropagation();
    if (e.cancelable) {
      e.preventDefault();
    }
    onSelectTool(toolId);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="roblox-hotbar-bar select-none"
    >
      {tools.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            id={`tool-slot-${t.id}`}
            onClick={(e) => handleSelect(e, t.id)}
            onTouchStart={(e) => handleSelect(e, t.id)}
            className={`roblox-hotbar-slot ${isActive ? 'active' : ''}`}
          >
            {/* Slot Number Badge */}
            <span className="roblox-slot-key">
              {t.num}
            </span>

            {/* Icon */}
            <div className={isActive ? 'text-amber-300' : 'text-neutral-300'}>
              {t.icon}
            </div>

            {/* Name label */}
            <span className="text-[9px] font-bold text-neutral-200 truncate max-w-[48px] mt-0.5">
              {t.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
