import React from 'react';
import { AvatarConfig, AvatarFace, AvatarHat } from '../types';
import { X, Check, Sparkles } from 'lucide-react';

interface AvatarEditorProps {
  config: AvatarConfig;
  onChange: (updated: Partial<AvatarConfig>) => void;
  onClose: () => void;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ config, onChange, onClose }) => {
  const [selectedBodyPart, setSelectedBodyPart] = React.useState<
    'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg'
  >('torso');

  const skinAndBrickColors = [
    { hex: '#f1c40f', name: 'Yellow' },
    { hex: '#e74c3c', name: 'Bright Red' },
    { hex: '#3498db', name: 'Bright Blue' },
    { hex: '#2ecc71', name: 'Bright Green' },
    { hex: '#2c3e50', name: 'Dark Blue / Jeans' },
    { hex: '#111111', name: 'Black' },
    { hex: '#ecf0f1', name: 'White' },
    { hex: '#e67e22', name: 'Orange' },
    { hex: '#9b59b6', name: 'Purple' },
    { hex: '#e0ac69', name: 'Tan Skin' },
    { hex: '#8d5524', name: 'Dark Skin' },
    { hex: '#795548', name: 'Brown' },
  ];

  const faces: { id: AvatarFace; name: string; icon: string }[] = [
    { id: 'smile', name: 'Smile ()', icon: '🙂' },
    { id: 'determined', name: 'Determined / Angry', icon: '😠' },
    { id: 'oops', name: 'Oops / Shocked', icon: '😮' },
    { id: 'cool', name: 'Cool Sunglasses', icon: '😎' },
    { id: 'epic', name: 'Epic Face', icon: '😃' },
  ];

  const hats: { id: AvatarHat; name: string; icon: string }[] = [
    { id: 'none', name: 'No Hat', icon: '❌' },
    { id: 'fedora', name: 'Black Fedora', icon: '🎩' },
    { id: 'domino', name: 'Domino Crown', icon: '👑' },
    { id: 'visor', name: 'Verlex Green Visor', icon: '🧢' },
    { id: 'bandana', name: 'Red Bandana', icon: '🧣' },
    { id: 'horns', name: 'Demon Horns', icon: '😈' },
    { id: 'blockhead', name: 'Propeller Beanie', icon: '🚁' },
  ];

  const shirts = [
    { id: 'none', name: 'No Shirt (Default Torso)', icon: '🚫' },
    { id: 'red_tuxedo', name: 'Classic Crimson Tuxedo', icon: '👔' },
    { id: 'verlex_hoodie', name: 'VERLEX Admin Pullover Hoodie', icon: '🧥' },
    { id: 'galaxy_suit', name: 'Nebula Galaxy Suit', icon: '🌌' },
    { id: 'cyber_armor', name: 'Cyberpunk Exo-Jacket', icon: '🦾' },
    { id: 'denim_jacket', name: 'Vintage Builder Denim Jacket', icon: '👕' },
    { id: 'royalty_shirt', name: 'Golden Royalty Tunic', icon: '👑' },
  ];

  const pants = [
    { id: 'none', name: 'No Pants (Default Legs)', icon: '🚫' },
    { id: 'blue_jeans', name: 'Classic Ripped Blue Jeans', icon: '👖' },
    { id: 'cargo_pants', name: 'Tactical Shadow Cargo Pants', icon: '🩳' },
    { id: 'tuxedo_slacks', name: 'Black Tuxedo Slacks', icon: '👖' },
    { id: 'black_joggers', name: 'Streetwear Black Joggers', icon: '👖' },
    { id: 'royal_leggings', name: 'Royal Guard Greaves', icon: '🛡️' },
  ];

  const handleColorPick = (colorHex: string) => {
    switch (selectedBodyPart) {
      case 'head':
        onChange({ headColor: colorHex });
        break;
      case 'torso':
        onChange({ torsoColor: colorHex });
        break;
      case 'leftArm':
        onChange({ leftArmColor: colorHex });
        break;
      case 'rightArm':
        onChange({ rightArmColor: colorHex });
        break;
      case 'leftLeg':
        onChange({ leftLegColor: colorHex });
        break;
      case 'rightLeg':
        onChange({ rightLegColor: colorHex });
        break;
    }
  };

  const getPartColor = (part: typeof selectedBodyPart) => {
    switch (part) {
      case 'head': return config.headColor;
      case 'torso': return config.torsoColor;
      case 'leftArm': return config.leftArmColor;
      case 'rightArm': return config.rightArmColor;
      case 'leftLeg': return config.leftLegColor;
      case 'rightLeg': return config.rightLegColor;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>R6 Avatar Customizer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Top Row: R6 Body Rig Interactive Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-3">
              1. Choose Body Part to Color
            </label>
            <div className="flex justify-center items-center py-4 bg-neutral-950/60 rounded-2xl border border-neutral-800">
              <div className="flex flex-col items-center gap-1">
                {/* Head */}
                <button
                  onClick={() => setSelectedBodyPart('head')}
                  className={`w-12 h-12 rounded-lg border-2 transition ${
                    selectedBodyPart === 'head' ? 'border-amber-400 ring-2 ring-amber-400 scale-105' : 'border-neutral-700'
                  }`}
                  style={{ backgroundColor: config.headColor }}
                  title="Head"
                />

                {/* Torso & Arms */}
                <div className="flex items-center gap-1">
                  {/* Left Arm */}
                  <button
                    onClick={() => setSelectedBodyPart('leftArm')}
                    className={`w-8 h-16 rounded-lg border-2 transition ${
                      selectedBodyPart === 'leftArm' ? 'border-amber-400 ring-2 ring-amber-400 scale-105' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: config.leftArmColor }}
                    title="Left Arm"
                  />
                  {/* Torso */}
                  <button
                    onClick={() => setSelectedBodyPart('torso')}
                    className={`w-16 h-16 rounded-lg border-2 transition ${
                      selectedBodyPart === 'torso' ? 'border-amber-400 ring-2 ring-amber-400 scale-105' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: config.torsoColor }}
                    title="Torso"
                  />
                  {/* Right Arm */}
                  <button
                    onClick={() => setSelectedBodyPart('rightArm')}
                    className={`w-8 h-16 rounded-lg border-2 transition ${
                      selectedBodyPart === 'rightArm' ? 'border-amber-400 ring-2 ring-amber-400 scale-105' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: config.rightArmColor }}
                    title="Right Arm"
                  />
                </div>

                {/* Legs */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedBodyPart('leftLeg')}
                    className={`w-7 h-16 rounded-lg border-2 transition ${
                      selectedBodyPart === 'leftLeg' ? 'border-amber-400 ring-2 ring-amber-400 scale-105' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: config.leftLegColor }}
                    title="Left Leg"
                  />
                  <button
                    onClick={() => setSelectedBodyPart('rightLeg')}
                    className={`w-7 h-16 rounded-lg border-2 transition ${
                      selectedBodyPart === 'rightLeg' ? 'border-amber-400 ring-2 ring-amber-400 scale-105' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: config.rightLegColor }}
                    title="Right Leg"
                  />
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-neutral-400 mt-2 font-medium">
              Selected: <span className="text-amber-400 font-bold uppercase">{selectedBodyPart}</span>
            </div>
          </div>

          {/* Color Palette for selected part */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              2. Pick Color for {selectedBodyPart.toUpperCase()}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {skinAndBrickColors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => handleColorPick(c.hex)}
                  className={`h-10 rounded-xl border-2 transition transform hover:scale-105 flex items-center justify-center ${
                    getPartColor(selectedBodyPart).toLowerCase() === c.hex.toLowerCase()
                      ? 'border-white ring-2 ring-amber-400 shadow-md'
                      : 'border-neutral-700 hover:border-neutral-500'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {getPartColor(selectedBodyPart).toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="w-4 h-4 text-black bg-white/60 rounded-full p-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Face Decals */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              3. Face
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {faces.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onChange({ face: f.id })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                    config.face === f.id
                      ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-2xl mb-1">{f.icon}</span>
                  <span className="text-[10px] text-center leading-tight truncate max-w-full">
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Verlex Hats & Accessories */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              4. Verlex Hat / Accessory
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {hats.map((h) => (
                <button
                  key={h.id}
                  onClick={() => onChange({ hat: h.id })}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition text-left ${
                    config.hat === h.id
                      ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-xl">{h.icon}</span>
                  <span className="text-[11px] leading-tight font-medium">{h.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shirts & Hoodies */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              5. Equipped Shirt / Outerwear
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {shirts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ shirt: s.id as any })}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition text-left ${
                    config.shirt === s.id
                      ? 'bg-indigo-600/40 border-indigo-400 text-white font-bold'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-[11px] leading-tight font-medium line-clamp-1">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pants & Greaves */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              6. Equipped Pants / Armor Leggings
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChange({ pants: p.id as any })}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition text-left ${
                    config.pants === p.id
                      ? 'bg-indigo-600/40 border-indigo-400 text-white font-bold'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-[11px] leading-tight font-medium line-clamp-1">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950/80 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            Apply & Play
          </button>
        </div>
      </div>
    </div>
  );
};
