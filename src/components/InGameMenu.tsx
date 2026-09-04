import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Users, 
  Globe, 
  HelpCircle, 
  Monitor, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  LogOut, 
  Sparkles, 
  Info,
  Layers,
  Flame,
  ShieldAlert,
  Zap,
  ArrowRight
} from 'lucide-react';
import { MapTemplateId } from '../types';
import { sounds } from '../game/soundEngine';

interface InGameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
  onResetCharacter: () => void;
  playerName: string;
  roomCode: string;
  peerCount: number;
  currentMap: MapTemplateId;
  onSelectMap: (map: MapTemplateId) => void;
  
  // Settings States & Handlers passed from App.tsx
  isMuted: boolean;
  onToggleMute: () => void;
  isShiftLock: boolean;
  onToggleShiftLock: () => void;
  
  screenScaleMode: 'full' | '16-9' | '4-3' | 'phone';
  onScreenScaleModeChange: (mode: 'full' | '16-9' | '4-3' | 'phone') => void;
  
  resolutionScale: number;
  onResolutionScaleChange: (scale: number) => void;

  // World Events
  onTriggerEvent?: (eventType: 'gravity' | 'rain' | 'nuke' | 'tsunami') => void;
}

export const InGameMenu: React.FC<InGameMenuProps> = ({
  isOpen,
  onClose,
  onLeave,
  onResetCharacter,
  playerName,
  roomCode,
  peerCount,
  currentMap,
  onSelectMap,
  isMuted,
  onToggleMute,
  isShiftLock,
  onToggleShiftLock,
  screenScaleMode,
  onScreenScaleModeChange,
  resolutionScale,
  onResolutionScaleChange,
  onTriggerEvent
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'players' | 'world' | 'help'>('settings');

  if (!isOpen) return null;

  const handleTabChange = (tab: 'settings' | 'players' | 'world' | 'help') => {
    sounds.playClick();
    setActiveTab(tab);
  };

  const handleEventClick = (type: 'gravity' | 'rain' | 'nuke' | 'tsunami') => {
    sounds.playClick();
    if (onTriggerEvent) {
      onTriggerEvent(type);
    }
  };

  return (
    <div className="roblox-esc-overlay select-none">
      <div className="roblox-esc-modal">
        
        {/* Top Header Title Bar */}
        <div className="roblox-esc-titlebar">
          <div className="flex items-center gap-2">
            <div className="roblox-brand-tile w-6 h-6 text-xs">
              V
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wider text-white drop-shadow">
                VERLEX IN-GAME MENU
              </h2>
              <p className="text-[10px] text-blue-200 font-mono">Server ID: {roomCode} • Region: P2P Network</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="roblox-btn roblox-btn-classic p-1 text-xs"
            title="Resume Game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="roblox-esc-tabs">
          <button
            onClick={() => handleTabChange('settings')}
            className={`roblox-esc-tab-btn flex items-center gap-1.5 ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Scale</span>
          </button>
          
          <button
            onClick={() => handleTabChange('players')}
            className={`roblox-esc-tab-btn flex items-center gap-1.5 ${activeTab === 'players' ? 'active' : ''}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Players ({peerCount + 1})</span>
          </button>
          
          <button
            onClick={() => handleTabChange('world')}
            className={`roblox-esc-tab-btn flex items-center gap-1.5 ${activeTab === 'world' ? 'active' : ''}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>World Events</span>
          </button>
          
          <button
            onClick={() => handleTabChange('help')}
            className={`roblox-esc-tab-btn flex items-center gap-1.5 ${activeTab === 'help' ? 'active' : ''}`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Controls Guide</span>
          </button>
        </div>

        {/* Tab Body Content Area */}
        <div className="p-4 bg-[#1d2026] min-h-[300px] max-h-[50vh] overflow-y-auto custom-scrollbar">
          
          {/* TAB: SETTINGS & DYNAMIC SCREEN SIZER */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              
              {/* Dynamic Screen Sizer */}
              <div className="roblox-bevel-box p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">Dynamic Screen Layout</h3>
                </div>
                
                <p className="text-neutral-300 text-[11px] mb-3">
                  Select how the 3D viewport canvas scales itself. Perfect for previewing mobile screen constraints or fitting custom displays.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'full', label: 'Auto Fullscreen', desc: 'Fits entire page' },
                    { id: '16-9', label: 'Cinema 16:9', desc: 'Letterbox monitor' },
                    { id: '4-3', label: 'Retro 4:3', desc: 'Box studio view' },
                    { id: 'phone', label: 'Mobile Handset', desc: 'Sleek phone bezel' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        sounds.playClick();
                        onScreenScaleModeChange(item.id as any);
                      }}
                      className={`p-2.5 rounded border text-left transition ${
                        screenScaleMode === item.id
                          ? 'roblox-btn-blue border-sky-300 font-bold'
                          : 'roblox-inset-box hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Sizer / Multiplier */}
              <div className="roblox-bevel-box p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">Render Resolution Scale</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-300">{Math.round(resolutionScale * 100)}%</span>
                </div>
                
                <p className="text-neutral-300 text-[11px] mb-3">
                  Adjust internal rendering buffer density. Lower resolutions significantly boost framerates on low-end hardware.
                </p>

                <div className="flex items-center gap-2">
                  {[
                    { val: 0.5, label: 'Performance (50%)' },
                    { val: 0.75, label: 'Balanced (75%)' },
                    { val: 1.0, label: 'High Quality (100%)' }
                  ].map((res) => (
                    <button
                      key={res.val}
                      onClick={() => {
                        sounds.playClick();
                        onResolutionScaleChange(res.val);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded text-center text-xs font-bold transition ${
                        resolutionScale === res.val
                          ? 'roblox-btn-gold'
                          : 'roblox-btn-classic'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Game settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Audio Settings */}
                <div className="roblox-inset-box p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-neutral-200">Mute Game Audio</div>
                    <div className="text-[10px] text-neutral-400">Mute building, tools, and sounds</div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onToggleMute();
                    }}
                    className={`roblox-btn p-2 ${isMuted ? 'roblox-btn-red' : 'roblox-btn-classic'}`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Shift Lock toggle */}
                <div className="roblox-inset-box p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-neutral-200">Camera Shift-Lock</div>
                    <div className="text-[10px] text-neutral-400">Enable lock pointer camera orbit</div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onToggleShiftLock();
                    }}
                    className={`roblox-btn px-3 py-1 text-xs font-bold ${
                      isShiftLock ? 'roblox-btn-blue' : 'roblox-btn-classic'
                    }`}
                  >
                    {isShiftLock ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB: PLAYERS LIST */}
          {activeTab === 'players' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-amber-400 text-xs px-2 font-bold uppercase border-b border-neutral-700 pb-1">
                <span>Player Username</span>
                <span>Role / Status</span>
              </div>
              
              <div className="space-y-2">
                {/* Local player */}
                <div className="roblox-inset-box p-2.5 flex items-center justify-between border-l-4 border-l-sky-500">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-red-600 flex items-center justify-center text-white font-extrabold text-xs">
                      {playerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{playerName}</span>
                        <span className="bg-red-900 text-red-200 text-[9px] px-1 py-0.2 rounded font-bold uppercase">You</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">Host (Local Player)</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">0 ms</div>
                </div>

                {/* Connected Peers via P2P */}
                {peerCount > 0 ? (
                  Array.from({ length: peerCount }).map((_, i) => (
                    <div key={i} className="roblox-inset-box p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center text-white font-extrabold text-xs">
                          P{i + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Connected Guest #{i + 1}</div>
                          <div className="text-[10px] text-neutral-400">WebRTC Data Channel Sync</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">Active</div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-neutral-400 text-xs roblox-inset-box">
                    No remote players currently connected. Share your server join code <strong className="text-amber-400">{roomCode}</strong> to start playing multiplayer!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: WORLD EVENTS (FUN INTERACTIONS) */}
          {activeTab === 'world' && (
            <div className="space-y-4">
              <div className="roblox-bevel-box p-3 flex gap-2">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-neutral-200 leading-relaxed">
                  As the server moderator, you can trigger real-time physical disruptions and global modifiers across the arena!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleEventClick('gravity')}
                  className="p-3 roblox-bevel-box text-left transition group hover:border-sky-400"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-sky-400">Lunar Low Gravity</span>
                    <Flame className="w-4 h-4 text-sky-400" />
                  </div>
                  <p className="text-[10px] text-neutral-300">
                    Reduces scene gravity to 1/6th normal speed. Everything floats like on the Moon!
                  </p>
                </button>

                <button
                  onClick={() => handleEventClick('rain')}
                  className="p-3 roblox-bevel-box text-left transition group hover:border-yellow-400"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-yellow-400">Meteor Block Storm</span>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </div>
                  <p className="text-[10px] text-neutral-300">
                    Spawns a downpour of physical building blocks from the sky across the map!
                  </p>
                </button>

                <button
                  onClick={() => handleEventClick('tsunami')}
                  className="p-3 roblox-bevel-box text-left transition group hover:border-cyan-400"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-cyan-400">Physics Tsunami Wave</span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-[10px] text-neutral-300">
                    Launches a giant wall of heavy bricks across the platform, sweeping unanchored blocks!
                  </p>
                </button>

                <button
                  onClick={() => handleEventClick('nuke')}
                  className="p-3 roblox-bevel-box text-left transition group hover:border-red-400"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-red-500">Detonate All TNT</span>
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-[10px] text-neutral-300">
                    Triggers massive explosion vectors across all dynamic materials in the arena!
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB: HELP / CONTROLS GUIDE */}
          {activeTab === 'help' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 roblox-inset-box flex items-center justify-between">
                  <span className="text-neutral-400">Move Around:</span>
                  <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">W, A, S, D</span>
                </div>
                <div className="p-2 roblox-inset-box flex items-center justify-between">
                  <span className="text-neutral-400">Jump Avatar:</span>
                  <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">SPACE</span>
                </div>
                <div className="p-2 roblox-inset-box flex items-center justify-between">
                  <span className="text-neutral-400">Orbit Camera:</span>
                  <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">Right Mouse Drag</span>
                </div>
                <div className="p-2 roblox-inset-box flex items-center justify-between">
                  <span className="text-neutral-400">Shift Lock Toggle:</span>
                  <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">SHIFT key</span>
                </div>
              </div>

              <div className="roblox-bevel-box p-3 text-[11px]">
                <div className="font-bold text-white mb-1 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Special Item Behaviors:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-neutral-300">
                  <li><strong className="text-blue-400">Tractor Gravity Gun [3]:</strong> Lock-on unanchored blocks, then tap again to fire.</li>
                  <li><strong className="text-red-400">RPG Launcher [4]:</strong> Fires high-speed rockets that burst on collision.</li>
                  <li><strong className="text-yellow-400">Stud Spray Paint [6]:</strong> Right click dynamic blocks to paint custom materials.</li>
                  <li><strong className="text-red-500">Stud Destroyer [8]:</strong> Deletes any part you tap on instantly.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer Action Buttons */}
        <div className="p-3 bg-[#181b21] border-t-2 border-t-[#0c0d10] flex flex-wrap gap-2 items-center justify-between">
          <button
            onClick={() => {
              sounds.playClick();
              onLeave();
            }}
            className="roblox-btn roblox-btn-red px-3 py-1.5 text-xs gap-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Game</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResetCharacter();
                onClose();
              }}
              className="roblox-btn roblox-btn-classic px-3 py-1.5 text-xs gap-1"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reset Character</span>
            </button>
            
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="roblox-btn roblox-btn-green px-4 py-1.5 text-xs gap-1 font-bold"
            >
              <span>Resume Game</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
