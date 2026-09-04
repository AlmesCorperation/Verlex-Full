import React, { useState } from 'react';
import { X, Users, Copy, Check, Wifi, Globe, ShieldCheck } from 'lucide-react';

interface MultiplayerModalProps {
  roomCode: string;
  isConnected: boolean;
  isConnecting: boolean;
  peerCount: number;
  onHostRoom: () => void;
  onJoinRoom: (code: string) => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  roomCode,
  isConnected,
  isConnecting,
  peerCount,
  onHostRoom,
  onJoinRoom,
  onClose,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onJoinRoom(inputCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Zero-Cost P2P Multiplayer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Zero-cost Explainer banner */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-start gap-3 text-xs text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">100% Free Peer-to-Peer Networking</span>
              Players connect directly via encrypted WebRTC DataChannels with zero server fees or external hosting costs.
            </div>
          </div>

          {/* Current Room Status */}
          {roomCode ? (
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-center space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Your Active Room Code
              </span>
              <div className="text-3xl font-black font-mono tracking-widest text-amber-400">
                {roomCode}
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl border border-neutral-700 transition shadow"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 text-xs text-neutral-400">
                <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                <span>
                  {isConnected ? `Connected with ${peerCount} player${peerCount === 1 ? '' : 's'}` : 'Connecting...'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={onHostRoom}
                disabled={isConnecting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                <span>{isConnecting ? 'Generating P2P Room...' : 'Host New P2P Room'}</span>
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink mx-3 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
              Or Join a Friend
            </span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoinSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 block">
              Enter Friend's Room Code (e.g. VRX-1234)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VRX-XXXX"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase tracking-wider outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputCode.trim() || isConnecting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
              >
                Join
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950/80 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
