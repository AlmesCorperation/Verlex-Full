import React, { useState, useEffect } from 'react';
import { sounds } from '../game/soundEngine';
import { playerRegistryService, RegisteredPlayer } from '../services/playerRegistryService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (name: string) => void;
  currentName: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentName,
}) => {
  const [username, setUsername] = useState<string>(currentName);
  const [password, setPassword] = useState<string>('••••••••');
  const [error, setError] = useState<string>('');
  const [playersList, setPlayersList] = useState<RegisteredPlayer[]>([]);

  useEffect(() => {
    setPlayersList(playerRegistryService.getAllPlayersNewestToOldest());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a valid Character Name.');
      return;
    }
    sounds.playClick();
    const cleanName = username.trim();
    const res = playerRegistryService.authenticateOrRegister(cleanName, password);
    if (!res.success) {
      setError(res.message || 'Authentication failed.');
      return;
    }
    if (res.player) {
      onLogin(res.player.username);
      onClose();
    }
  };

  const handleSelectAccount = (accName: string) => {
    sounds.playClick();
    setUsername(accName);
    setPassword('');
    setError(`Selected account "${accName}". Enter account password to log in.`);
  };

  const handleGuest = () => {
    sounds.playClick();
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const guestName = `Guest-${guestNum}`;
    const res = playerRegistryService.authenticateOrRegister(guestName, 'guestpass');
    if (res.player) {
      onLogin(res.player.username);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#f0f0f0] border-2 border-[#1e3d7a] rounded-t-sm shadow-[0_10px_25px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Title Bar (Windows / Verlex XP blue gradient) */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#0b6aff] to-[#0055ea] text-white px-3 py-1.5 flex items-center justify-between font-bold text-sm shadow-xs border-b border-[#0033aa]">
          <div className="flex items-center space-x-1.5">
            <span className="text-yellow-300">★</span>
            <span>Member Login &amp; Account Switcher - VERLEX</span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-5 h-5 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-xs flex items-center justify-center rounded-xs border border-white/60 shadow-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 font-sans text-xs">
          <div className="text-gray-700 leading-normal text-xs">
            Enter your Character Name or select a registered account from the P2P Player Database below.
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-bold text-gray-800">Character Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="e.g. Builderman, Clockwork"
              maxLength={20}
              className="w-full px-2 py-1.5 bg-white border-2 border-dashed border-gray-500 font-mono text-sm text-black focus:outline-none focus:border-blue-600 shadow-inner"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-gray-800">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border-2 border-dashed border-gray-500 font-mono text-sm text-black focus:outline-none focus:border-blue-600 shadow-inner"
            />
          </div>

          {/* Quick Select Signed Up Accounts */}
          <div className="pt-1 border-t border-gray-300">
            <label className="block font-bold text-gray-700 text-[11px] mb-1">
              📜 Signed-Up Player Accounts Database (Newest to Oldest):
            </label>
            <div className="bg-white border border-gray-300 rounded p-1.5 max-h-28 overflow-y-auto space-y-1">
              {playersList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectAccount(p.username)}
                  className={`p-1.5 text-xs rounded flex items-center justify-between cursor-pointer transition ${
                    username.toLowerCase() === p.username.toLowerCase()
                      ? 'bg-blue-100 text-blue-900 font-bold border border-blue-400'
                      : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-[10px] text-gray-400 font-bold">#{p.registeredIndex}</span>
                    <span className="font-bold">{p.username}</span>
                    {p.isUnlimitedVBucks && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-400 px-1 rounded font-black">
                        ∞ Unlimited V$
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-blue-600 font-bold hover:underline">
                    Select &gt;
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleGuest}
              className="text-[#003399] hover:underline font-bold text-xs"
            >
              Play as Guest &gt;
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 border border-gray-500 text-gray-800 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-gradient-to-b from-[#5c87de] to-[#3f63b0] hover:from-[#6b95ee] hover:to-[#4a70c2] border border-[#1e3d7a] text-white font-bold shadow-xs active:translate-y-0.5 cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
