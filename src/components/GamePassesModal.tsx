import React, { useState, useEffect } from 'react';
import { GamePass, economyService } from '../services/economyService';
import { sounds } from '../game/soundEngine';
import { X, ShoppingBag, PlusCircle, Sparkles, Check, AlertCircle, Coins, ShieldCheck, Zap } from 'lucide-react';

interface GamePassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  playerName: string;
}

export const GamePassesModal: React.FC<GamePassesModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  playerName,
}) => {
  const [verbucks, setVerbucks] = useState<number>(economyService.getVerbucks());
  const [gamePasses, setGamePasses] = useState<GamePass[]>(economyService.getAllGamePassesForGame(gameId));
  const [ownedPasses, setOwnedPasses] = useState<string[]>(economyService.getOwnedGamePasses());
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Creation form state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [passName, setPassName] = useState<string>('');
  const [passDesc, setPassDesc] = useState<string>('');
  const [passPrice, setPassPrice] = useState<number>(100);
  const [passIcon, setPassIcon] = useState<string>('⚡');
  const [passPerk, setPassPerk] = useState<GamePass['perkType']>('speed_coil');

  const iconsList = ['⚡', '🌀', '⚔️', '🚀', '👟', '🛡️', '🏗️', '💥', '👑', '🔮', '💣', '🌟'];

  const perkOptions: { id: GamePass['perkType']; label: string; desc: string }[] = [
    { id: 'speed_coil', label: 'Speed Coil (+50% Speed)', desc: 'Increases player walkspeed significantly' },
    { id: 'gravity_coil', label: 'Gravity Coil (Float Jump)', desc: 'Reduces gravity for high floaty jumps' },
    { id: 'golden_sword', label: 'VIP Golden Sword', desc: 'Golden sword with +50% slash damage & VIP badge' },
    { id: 'jetpack', label: 'Super Rocket Jetpack', desc: 'Thrust into the sky with infinite rocket fuel' },
    { id: 'double_jump', label: 'High Jump Boots', desc: 'Allows double jumping in mid-air' },
    { id: 'lava_shield', label: 'Lava Immunity Shield', desc: 'Prevents damage from hazardous lava/hazard bricks' },
    { id: 'neon_builder', label: 'Master Builder Neon Tools', desc: 'Unlocks glowing materials & speed conveyors' },
    { id: 'vip_tag', label: 'VIP Name Tag & Aura', desc: 'Golden glowing name tag above avatar' },
  ];

  useEffect(() => {
    const update = () => {
      setVerbucks(economyService.getVerbucks());
      setGamePasses(economyService.getAllGamePassesForGame(gameId));
      setOwnedPasses(economyService.getOwnedGamePasses());
    };
    update();
    return economyService.subscribe(update);
  }, [gameId]);

  if (!isOpen) return null;

  const handleBuyPass = (pass: GamePass) => {
    sounds.playClick();
    const res = economyService.buyGamePass(pass);
    if (res.success) {
      setNotice({ type: 'success', text: res.message });
    } else {
      setNotice({ type: 'error', text: res.message });
    }
    setTimeout(() => setNotice(null), 4500);
  };

  const handleCreatePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();

    if (!passName.trim()) {
      setNotice({ type: 'error', text: 'Please enter a name for your Game Pass.' });
      return;
    }

    if (passPrice <= 0) {
      setNotice({ type: 'error', text: 'Price must be greater than 0 V$.' });
      return;
    }

    const created = economyService.createGamePass(
      gameId,
      gameTitle,
      passName.trim(),
      passDesc.trim() || `Official Game Pass for ${gameTitle}`,
      passIcon,
      passPrice,
      passPerk,
      playerName
    );

    setNotice({
      type: 'success',
      text: `🎉 Created Game Pass "${created.name}" for ${created.priceVBucks} V$! It is now listed in ${gameTitle}'s Store.`,
    });

    setIsCreating(false);
    setPassName('');
    setPassDesc('');
    setPassPrice(100);

    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 select-none font-sans">
      <div className="bg-[#f0f0f0] border-2 border-[#1e3d7a] w-full max-w-2xl rounded-xs shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3d7a] to-[#2b529a] text-white p-3.5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-wide leading-tight">
                {gameTitle} &ndash; Game Passes &amp; Store
              </h2>
              <p className="text-[11px] text-blue-200">
                Buy perks or create your own Game Passes to monetize this game!
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-emerald-950 text-emerald-300 border border-emerald-500/80 px-2.5 py-1 rounded-xs font-mono font-black text-xs shadow-inner flex items-center space-x-1">
              <span className="text-emerald-400">V$:</span>
              <span>{verbucks}</span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1 hover:bg-blue-800 rounded-xs text-blue-200 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div
            className={`p-2.5 px-4 text-xs font-bold flex items-center space-x-2 border-b ${
              notice.type === 'success' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'
            }`}
          >
            {notice.type === 'success' ? <Sparkles className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white p-3 border border-gray-300 shadow-xs">
            <div>
              <h3 className="font-bold text-xs text-[#1e3d7a]">
                Available Game Passes ({gamePasses.length})
              </h3>
              <p className="text-[11px] text-gray-600">
                Passes stay unlocked permanently when playing {gameTitle}.
              </p>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                setIsCreating(!isCreating);
              }}
              className="px-3 py-1.5 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] border border-[#b87d00] text-black font-extrabold text-xs shadow-xs hover:brightness-105 cursor-pointer flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Cancel Creation' : '➕ Create Game Pass'}</span>
            </button>
          </div>

          {/* Create Form inline if open */}
          {isCreating && (
            <form onSubmit={handleCreatePassSubmit} className="bg-blue-50 border-2 border-blue-400 p-4 rounded-xs shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <h4 className="font-extrabold text-xs text-[#1e3d7a] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Create New Game Pass for {gameTitle}</span>
                </h4>
                <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded">
                  Monetization Feature
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pass Name *</label>
                  <input
                    type="text"
                    value={passName}
                    onChange={(e) => setPassName(e.target.value)}
                    placeholder="e.g. VIP Speed Boost"
                    className="w-full p-2 bg-white border border-gray-400 rounded-xs font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                    maxLength={30}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price in Verbucks (V$) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={passPrice}
                      onChange={(e) => setPassPrice(Math.max(1, parseInt(e.target.value) || 0))}
                      min={1}
                      max={10000}
                      className="w-full p-2 bg-white border border-gray-400 rounded-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                    <span className="absolute right-3 top-2 font-black text-emerald-600 text-xs">V$</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs">Choose Icon Emoji</label>
                <div className="flex flex-wrap gap-1.5">
                  {iconsList.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setPassIcon(ic)}
                      className={`w-8 h-8 rounded border text-base flex items-center justify-center cursor-pointer ${
                        passIcon === ic ? 'bg-amber-300 border-amber-600 ring-2 ring-amber-400' : 'bg-white border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs">In-Game Perk Ability *</label>
                <select
                  value={passPerk}
                  onChange={(e) => setPassPerk(e.target.value as any)}
                  className="w-full p-2 bg-white border border-gray-400 rounded-xs font-bold text-xs text-gray-800"
                >
                  {perkOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} &ndash; {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs">Description</label>
                <textarea
                  value={passDesc}
                  onChange={(e) => setPassDesc(e.target.value)}
                  placeholder="Explain what this pass gives players when they buy it!"
                  className="w-full p-2 bg-white border border-gray-400 rounded-xs text-xs text-gray-800"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs border border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-b from-[#5c87de] to-[#2d5dbd] text-white font-extrabold text-xs border border-[#1e3d7a] hover:brightness-110 shadow-xs cursor-pointer"
                >
                  🚀 Publish Game Pass &amp; Start Earning V$
                </button>
              </div>
            </form>
          )}

          {/* Game Passes List */}
          {gamePasses.length === 0 ? (
            <div className="bg-white border border-gray-300 p-8 text-center text-gray-500 text-xs">
              No Game Passes created for this game yet. Be the first to create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gamePasses.map((pass) => {
                const isOwned = ownedPasses.includes(pass.id);
                const isCreator = pass.creatorName === playerName || pass.isUserCreated;

                return (
                  <div
                    key={pass.id}
                    className={`bg-white border p-3 shadow-xs flex flex-col justify-between rounded-xs transition-all ${
                      isOwned ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-400 rounded-xs flex items-center justify-center text-2xl shadow-xs">
                            {pass.icon}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-[#1e3d7a]">
                              {pass.name}
                            </h4>
                            <div className="text-[10px] text-gray-500">
                              by <span className="font-bold text-gray-700">{pass.creatorName}</span>
                              {isCreator && <span className="ml-1 text-blue-600 font-bold">(You)</span>}
                            </div>
                          </div>
                        </div>

                        <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-xs font-black font-mono rounded-xs">
                          {pass.priceVBucks} V$
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-600 mt-2 line-clamp-2">
                        {pass.description}
                      </p>

                      <div className="mt-2 text-[10px] bg-gray-100 border border-gray-200 px-2 py-1 rounded text-gray-600 flex items-center justify-between">
                        <span>Sales: <strong className="text-gray-800">{pass.salesCount}</strong></span>
                        <span className="font-bold text-blue-700">Perk: {pass.perkType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-200 flex flex-col gap-1.5">
                      {isOwned ? (
                        <div className="w-full py-1 bg-emerald-600 text-white font-bold text-xs rounded-xs text-center flex items-center justify-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>✓ Unlocked &amp; Owned</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuyPass(pass)}
                          className="w-full py-1.5 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] border border-[#b87d00] text-black font-extrabold text-xs rounded-xs shadow-xs hover:brightness-105 active:translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Buy for {pass.priceVBucks} V$</span>
                        </button>
                      )}

                      {/* Creator simulate sale helper */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-200 p-3 border-t border-gray-300 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Start with 0 V$ &bull; Earn +100 V$ per day &bull; Create Passes to earn V$</span>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold border border-gray-500 rounded-xs cursor-pointer"
          >
            Close Store
          </button>
        </div>

      </div>
    </div>
  );
};
