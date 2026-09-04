import React from 'react';
import { X, HelpCircle, Gamepad2, Layers, Magnet, Flame, Sword } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <span>Verlex Controls & Gameplay Guide</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs text-neutral-300">
          {/* Movement Section */}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px] mb-2.5">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
              <span>Character Movement & Camera</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span>Move Avatar</span>
                <span className="font-mono font-bold bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">
                  W, A, S, D
                </span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span>Jump</span>
                <span className="font-mono font-bold bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">
                  SPACE
                </span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span>Verlex Shift-Lock</span>
                <span className="font-mono font-bold bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">
                  SHIFT
                </span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span>Turn Camera</span>
                <span className="font-mono font-bold bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">
                  Left / Right Arrows or Q / E
                </span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span>Orbit Camera</span>
                <span className="font-mono font-bold bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">
                  Right Mouse Drag
                </span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span>Zoom (1st to 3rd)</span>
                <span className="font-mono font-bold bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">
                  Mouse Wheel
                </span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span>Open Chat</span>
                <span className="font-mono font-bold bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">
                  / Key
                </span>
              </div>
            </div>
          </div>

          {/* Tools Hotbar Section */}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px] mb-2.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Tools & Inventory (Keys 1 - 8)</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-blue-400 mr-2">[1] Select / Inspect:</span>
                Click parts to inspect their Stud dimensions, anchored state, color, and duplicate/delete.
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-emerald-400 mr-2">[2] Stud Builder:</span>
                Place stud bricks, wedges, cylinders, spheres, TNT, and trampolines. Press <span className="font-mono font-bold text-white">R</span> to rotate ghost brick.
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-cyan-400 mr-2">[3] Gravity Gun:</span>
                Click unanchored physics bricks to pick them up with tractor beam, click again to launch them with Newtonian velocity!
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-amber-400 mr-2">[4] Rocket Launcher:</span>
                Fire ballistic rockets with explosive blast radius that knock down towers and blast unanchored studs apart!
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-indigo-400 mr-2">[5] Sword:</span>
                Linked sword with lunge slash animation, hitting dynamic objects and avatars.
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-rose-400 mr-2">[6] Paint Tool:</span>
                Click existing parts to recolor and retexture their surfaces.
              </div>
            </div>
          </div>

          {/* Newtonian Physics Tips */}
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl space-y-1">
            <span className="font-bold text-indigo-300 block text-xs">
              ⚡ Newtonian Physics Engine Features
            </span>
            <p className="text-indigo-200/90 leading-relaxed">
              Unanchored bricks have realistic mass and inertia. Stack them high, build domino chains, knock them down with rockets, or launch yourself high into the air with Trampoline jump pads!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950/80 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
