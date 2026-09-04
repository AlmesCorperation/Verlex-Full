import React, { useState, useEffect } from 'react';
import { 
  Users, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Sparkles, 
  Palette, 
  Copy,
  Check,
  MapPin,
  Server,
  ArrowLeft
} from 'lucide-react';
import { MapTemplateId, CollabEmoteType } from '../types';
import { sounds } from '../game/soundEngine';
import { economyService } from '../services/economyService';

interface TopbarProps {
  onExit: () => void;
  onOpenInGameMenu: () => void;
  currentMap: MapTemplateId;
  onSelectMap: (map: MapTemplateId) => void;
  onOpenMultiplayer: () => void;
  onOpenServerBrowser: () => void;
  onOpenAvatarEditor: () => void;
  onOpenHelp: () => void;
  onResetCharacter: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerEmote: (emote: 'dance' | 'wave' | 'cheer' | 'sit' | CollabEmoteType) => void;
  peerCount: number;
  roomCode: string;
  isHost?: boolean;
  isShiftLock: boolean;
  onToggleShiftLock: () => void;
  onOpenGameStore?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentMap,
  onSelectMap,
  onOpenMultiplayer,
  onOpenServerBrowser,
  onOpenAvatarEditor,
  onOpenHelp,
  onResetCharacter,
  isMuted,
  onToggleMute,
  onTriggerEmote,
  peerCount,
  roomCode,
  isHost = false,
  isShiftLock,
  onToggleShiftLock,
  onExit,
  onOpenInGameMenu,
  onOpenGameStore,
}) => {
  const [showEmotes, setShowEmotes] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verbucks, setVerbucks] = useState<number>(economyService.getVerbucks());

  useEffect(() => {
    const update = () => setVerbucks(economyService.getVerbucks());
    update();
    return economyService.subscribe(update);
  }, []);

  const mapsList: { id: MapTemplateId; name: string; desc: string }[] = [
    { id: 'crossroads', name: 'Crossroads Arena', desc: 'Castle towers & bridges' },
    { id: 'physics_lab', name: 'Newton Physics Lab', desc: 'Destructible towers & bounce pads' },
    { id: 'happy_home', name: 'Happy Home', desc: 'House & furniture sandbox' },
    { id: 'baseplate', name: 'Baseplate Grid', desc: 'Clean 128x128 stud grid' },
    { id: 'obby', name: 'Chaos Obby', desc: 'Jump pads, lava & conveyors' },
  ];

  const handleCopyCode = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (e.cancelable) {
      e.preventDefault();
    }
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTouchAction = (e: React.MouseEvent | React.TouchEvent, action: () => void) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    action();
  };

  return (
    <header className="roblox-gaming-topbar select-none">
      {/* Left Section: Classic Roblox Red Logo & Navigation */}
      <div className="flex items-center gap-2">
        {/* Exit Button */}
        <button
          onClick={(e) => handleTouchAction(e, onExit)}
          onTouchStart={(e) => handleTouchAction(e, onExit)}
          className="roblox-btn roblox-btn-classic px-2 py-1 text-xs gap-1"
          title="Exit to Site"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit</span>
        </button>

        {/* Menu ESC Button */}
        <button
          id="esc-game-menu-btn"
          onClick={(e) => handleTouchAction(e, onOpenInGameMenu)}
          onTouchStart={(e) => handleTouchAction(e, onOpenInGameMenu)}
          className="roblox-btn roblox-btn-red px-2.5 py-1 text-xs gap-1.5"
          title="Open Game Menu (ESC)"
        >
          <div className="roblox-brand-tile text-[10px] w-4 h-4">
            V
          </div>
          <span className="font-extrabold">Menu</span>
        </button>

        {/* Verlex Logo Badge */}
        <div className="hidden md:flex items-center gap-2 px-2 py-0.5 roblox-bevel-box text-xs">
          <div className="roblox-brand-tile w-5 h-5 text-xs">
            V
          </div>
          <span className="font-black text-white tracking-wider text-xs drop-shadow">
            VERLEX
          </span>
          <span className="text-[9px] font-bold px-1 py-0.2 bg-red-900 text-red-200 border border-red-600 rounded-xs">
            3D
          </span>
        </div>

        {/* Map Dropdown */}
        <div className="relative">
          <button
            id="map-selector-btn"
            onClick={(e) => handleTouchAction(e, () => setShowMaps(!showMaps))}
            onTouchStart={(e) => handleTouchAction(e, () => setShowMaps(!showMaps))}
            className="roblox-btn roblox-btn-classic px-2.5 py-1 text-xs gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{mapsList.find((m) => m.id === currentMap)?.name || 'Select World'}</span>
            <span className="sm:hidden">Map</span>
          </button>

          {showMaps && (
            <div className="absolute left-0 top-10 w-60 roblox-bevel-box p-1.5 z-50 flex flex-col gap-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 border-b border-neutral-700">
                Choose World
              </div>
              {mapsList.map((m) => (
                <button
                  key={m.id}
                  onClick={(e) => handleTouchAction(e, () => {
                    onSelectMap(m.id);
                    setShowMaps(false);
                  })}
                  onTouchStart={(e) => handleTouchAction(e, () => {
                    onSelectMap(m.id);
                    setShowMaps(false);
                  })}
                  className={`text-left px-2.5 py-1.5 rounded transition text-xs flex flex-col ${
                    currentMap === m.id
                      ? 'roblox-btn-blue font-bold'
                      : 'hover:bg-neutral-800 text-neutral-200'
                  }`}
                >
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-[10px] opacity-75">{m.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Active Server Code & Verbucks (V$) */}
      <div className="flex items-center gap-2">
        {roomCode && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 roblox-inset-box text-xs font-mono font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline text-neutral-400 font-sans text-[11px]">Server:</span>
            <span>{roomCode}</span>
            <span className="text-[9px] px-1 py-0.2 bg-neutral-800 text-neutral-300 border border-neutral-600 rounded-xs">
              {isHost ? 'HOST' : 'CLIENT'}
            </span>
            <button
              onClick={handleCopyCode}
              onTouchStart={handleCopyCode}
              title="Copy Join Code"
              className="p-0.5 hover:bg-neutral-700 text-neutral-300 rounded transition ml-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Verbucks (V$) Pill */}
        <div 
          className="flex items-center gap-1 px-2 py-0.5 roblox-inset-box text-xs font-black text-emerald-400 cursor-default"
          title={`Verbucks Balance: ${verbucks} V$`}
        >
          <span>V$:</span>
          <span className="font-mono text-white">{verbucks.toLocaleString()}</span>
        </div>

        {/* Store Button */}
        {onOpenGameStore && (
          <button
            onClick={(e) => handleTouchAction(e, onOpenGameStore)}
            onTouchStart={(e) => handleTouchAction(e, onOpenGameStore)}
            className="roblox-btn roblox-btn-gold px-2.5 py-1 text-xs gap-1"
            title="Open Game Store & Perks"
          >
            <span>🛒</span>
            <span className="hidden sm:inline">Store</span>
          </button>
        )}

        {/* Server Switcher */}
        <button
          id="server-browser-btn"
          onClick={(e) => handleTouchAction(e, onOpenServerBrowser)}
          onTouchStart={(e) => handleTouchAction(e, onOpenServerBrowser)}
          className="roblox-btn roblox-btn-classic px-2.5 py-1 text-xs gap-1"
          title="Browse or switch servers"
        >
          <Server className="w-3.5 h-3.5 text-yellow-400" />
          <span className="hidden lg:inline">Servers</span>
        </button>

        {/* Shift Lock toggle */}
        <button
          id="shift-lock-toggle-btn"
          onClick={(e) => handleTouchAction(e, onToggleShiftLock)}
          onTouchStart={(e) => handleTouchAction(e, onToggleShiftLock)}
          className={`hidden lg:flex roblox-btn px-2.5 py-1 text-xs gap-1.5 ${
            isShiftLock ? 'roblox-btn-blue' : 'roblox-btn-classic'
          }`}
          title="Toggle Shift Lock (Shift Key)"
        >
          <div className={`w-2 h-2 rounded-full ${isShiftLock ? 'bg-white animate-pulse' : 'bg-neutral-500'}`} />
          <span>Shift-Lock</span>
        </button>

        {/* Emotes Dropdown */}
        <div className="relative">
          <button
            id="emotes-btn"
            onClick={(e) => handleTouchAction(e, () => setShowEmotes(!showEmotes))}
            onTouchStart={(e) => handleTouchAction(e, () => setShowEmotes(!showEmotes))}
            className="roblox-btn roblox-btn-classic px-2 py-1 text-xs gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden md:inline">Emotes</span>
          </button>

          {showEmotes && (
            <div className="absolute top-10 -left-4 w-48 roblox-bevel-box p-1.5 z-50 flex flex-col gap-1 max-h-80 overflow-y-auto custom-scrollbar">
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase border-b border-neutral-700">
                Solo Emotes
              </div>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('sit'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('sit'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 rounded flex items-center justify-between"
              >
                <span>🧘 Sit</span>
                <span className="text-[10px] text-neutral-500 font-mono">/e sit</span>
              </button>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('dance'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('dance'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 rounded flex items-center justify-between"
              >
                <span>🕺 Dance</span>
                <span className="text-[10px] text-neutral-500 font-mono">/e dance</span>
              </button>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('wave'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('wave'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 rounded flex items-center justify-between"
              >
                <span>👋 Wave</span>
                <span className="text-[10px] text-neutral-500 font-mono">/e wave</span>
              </button>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('cheer'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('cheer'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 rounded flex items-center justify-between"
              >
                <span>🎉 Cheer</span>
                <span className="text-[10px] text-neutral-500 font-mono">/e cheer</span>
              </button>

              <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-sky-400 uppercase border-b border-neutral-700 mt-1">
                🤝 Collab Emotes
              </div>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('highfive'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('highfive'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-sky-200 hover:bg-sky-950/60 rounded flex items-center justify-between"
              >
                <span>✋ High Five</span>
                <span className="text-[10px] text-sky-400/80 font-mono">/e highfive</span>
              </button>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('hug'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('hug'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-sky-200 hover:bg-sky-950/60 rounded flex items-center justify-between"
              >
                <span>🫂 Duo Hug</span>
                <span className="text-[10px] text-sky-400/80 font-mono">/e hug</span>
              </button>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('rps'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('rps'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-sky-200 hover:bg-sky-950/60 rounded flex items-center justify-between"
              >
                <span>✊ Rock Paper Sci</span>
                <span className="text-[10px] text-sky-400/80 font-mono">/e rps</span>
              </button>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('duodance'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('duodance'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-sky-200 hover:bg-sky-950/60 rounded flex items-center justify-between"
              >
                <span>💃 Duo Dance</span>
                <span className="text-[10px] text-sky-400/80 font-mono">/e duodance</span>
              </button>
              <button
                onClick={(e) => handleTouchAction(e, () => { onTriggerEmote('carry'); setShowEmotes(false); })}
                onTouchStart={(e) => handleTouchAction(e, () => { onTriggerEmote('carry'); setShowEmotes(false); })}
                className="w-full text-left px-2 py-1 text-xs text-sky-200 hover:bg-sky-950/60 rounded flex items-center justify-between"
              >
                <span>🎒 Piggyback Ride</span>
                <span className="text-[10px] text-sky-400/80 font-mono">/e carry</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Multiplayer, Avatar, Mute, Reset, Help */}
      <div className="flex items-center gap-1.5">
        <button
          id="p2p-multiplayer-btn"
          onClick={(e) => handleTouchAction(e, onOpenMultiplayer)}
          onTouchStart={(e) => handleTouchAction(e, onOpenMultiplayer)}
          className="roblox-btn roblox-btn-classic px-2 py-1 text-xs gap-1"
          title="View Player List & P2P details"
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Players</span>
          <span className="px-1 py-0.2 bg-emerald-950 text-emerald-300 text-[10px] rounded font-bold border border-emerald-700/60">
            {peerCount + 1}
          </span>
        </button>

        <button
          id="avatar-customizer-btn"
          onClick={(e) => handleTouchAction(e, onOpenAvatarEditor)}
          onTouchStart={(e) => handleTouchAction(e, onOpenAvatarEditor)}
          className="roblox-btn roblox-btn-classic px-2 py-1 text-xs gap-1"
          title="Customize R6 Avatar & Hats"
        >
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">Avatar</span>
        </button>

        <button
          id="audio-mute-btn"
          onClick={(e) => handleTouchAction(e, onToggleMute)}
          onTouchStart={(e) => handleTouchAction(e, onToggleMute)}
          className="roblox-btn roblox-btn-classic p-1.5 text-xs"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        <button
          id="reset-char-btn"
          onClick={(e) => handleTouchAction(e, onResetCharacter)}
          onTouchStart={(e) => handleTouchAction(e, onResetCharacter)}
          className="roblox-btn roblox-btn-classic p-1.5 text-xs"
          title="Reset Character (Oof)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
        </button>

        <button
          id="help-modal-btn"
          onClick={(e) => handleTouchAction(e, onOpenHelp)}
          onTouchStart={(e) => handleTouchAction(e, onOpenHelp)}
          className="roblox-btn roblox-btn-classic p-1.5 text-xs"
          title="Controls & Help"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};
