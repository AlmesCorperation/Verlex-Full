import React, { useState, useEffect } from 'react';
import { AvatarConfig, AvatarFace, AvatarHat, AvatarTShirt } from '../types';
import { AvatarPreview } from './AvatarPreview';
import { sounds } from '../game/soundEngine';
import { economyService, GamePass, EconomyTransaction } from '../services/economyService';
import { Coins, Gift, Sparkles, PlusCircle, History, Zap, ShieldCheck, Check } from 'lucide-react';

interface MyVerlexPageProps {
  avatarConfig: AvatarConfig;
  onChangeConfig: (newConfig: Partial<AvatarConfig>) => void;
  playerName: string;
  onPlayPersonalPlace: () => void;
}

// Authentic Verlex Brick Color Palette
const VERLEX_CLASSIC_COLORS = [
  { name: 'Bright Yellow', hex: '#f5cd2f' },
  { name: 'Bright Blue', hex: '#0d69ac' },
  { name: 'Br. yellowish green', hex: '#a4bd46' },
  { name: 'Bright Red', hex: '#c4281c' },
  { name: 'White', hex: '#f2f3f3' },
  { name: 'Black', hex: '#1b2a35' },
  { name: 'Medium stone grey', hex: '#a3a2a5' },
  { name: 'Dark stone grey', hex: '#635f62' },
  { name: 'Bright orange', hex: '#da8541' },
  { name: 'Bright violet', hex: '#6b327c' },
  { name: 'Dark green', hex: '#285f2c' },
  { name: 'Nougat', hex: '#cc8e69' },
  { name: 'Pastel blue', hex: '#afddfe' },
  { name: 'Light reddish violet', hex: '#e8bac8' },
  { name: 'Sand red', hex: '#958a73' },
  { name: 'Earth green', hex: '#19472e' },
];

type BodyPartKey = 'headColor' | 'torsoColor' | 'leftArmColor' | 'rightArmColor' | 'leftLegColor' | 'rightLegColor';

export const MyVerlexPage: React.FC<MyVerlexPageProps> = ({
  avatarConfig,
  onChangeConfig,
  playerName,
  onPlayPersonalPlace,
}) => {
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPartKey>('torsoColor');
  const [activeTab, setActiveTab] = useState<'colors' | 'hats' | 'faces' | 'tshirts' | 'economy'>('colors');

  // Economy State
  const [verbucks, setVerbucks] = useState<number>(economyService.getVerbucks());
  const [tix, setTix] = useState<number>(economyService.getTix());
  const [daysPlayed, setDaysPlayed] = useState<number>(economyService.getTotalDaysPlayed());
  const [playtime, setPlaytime] = useState<string>(economyService.getFormattedPlaytime());
  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(economyService.canClaimDailyAllowance());
  const [createdPasses, setCreatedPasses] = useState<GamePass[]>(economyService.getCreatedGamePasses());
  const [transactions, setTransactions] = useState<EconomyTransaction[]>(economyService.getTransactions());
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Game Pass Form State
  const [newPassName, setNewPassName] = useState<string>('');
  const [newPassDesc, setNewPassDesc] = useState<string>('');
  const [newPassPrice, setNewPassPrice] = useState<number>(100);
  const [newPassGame, setNewPassGame] = useState<string>('personal_place');
  const [newPassIcon, setNewPassIcon] = useState<string>('⚡');
  const [newPassPerk, setNewPassPerk] = useState<GamePass['perkType']>('speed_coil');

  useEffect(() => {
    const update = () => {
      setVerbucks(economyService.getVerbucks());
      setTix(economyService.getTix());
      setDaysPlayed(economyService.getTotalDaysPlayed());
      setPlaytime(economyService.getFormattedPlaytime());
      setCanClaimDaily(economyService.canClaimDailyAllowance());
      setCreatedPasses(economyService.getCreatedGamePasses());
      setTransactions(economyService.getTransactions());
    };
    update();
    return economyService.subscribe(update);
  }, []);

  const handleClaimDaily = () => {
    sounds.playClick();
    const res = economyService.claimDailyAllowance();
    if (res.success) {
      setNotice({ type: 'success', text: res.message });
    } else {
      setNotice({ type: 'error', text: res.message });
    }
    setTimeout(() => setNotice(null), 4500);
  };

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();

    if (!newPassName.trim()) {
      setNotice({ type: 'error', text: 'Please enter a name for your Game Pass.' });
      return;
    }

    const created = economyService.createGamePass(
      newPassGame,
      newPassGame === 'personal_place' ? `${playerName}'s Personal Place` : 'Studio Custom Game',
      newPassName.trim(),
      newPassDesc.trim() || 'Custom game pass for player abilities',
      newPassIcon,
      newPassPrice,
      newPassPerk,
      playerName
    );

    setNotice({
      type: 'success',
      text: `🎉 Created Game Pass "${created.name}" for ${created.priceVBucks} V$! When players buy it, you earn V$ revenue!`,
    });

    setNewPassName('');
    setNewPassDesc('');
    setNewPassPrice(100);
    setTimeout(() => setNotice(null), 5000);
  };

  const hatOptions: { id: AvatarHat; name: string; icon: string; price: string }[] = [
    { id: 'none', name: 'No Hat', icon: '👤', price: 'Free' },
    { id: 'verlex_cap', name: 'VERLEX Baseball Cap', icon: '🧢', price: '15 V$' },
    { id: 'fedora', name: 'Fedora', icon: '🎩', price: '50 V$' },
    { id: 'domino', name: 'Domino Crown', icon: '👑', price: '2,500 V$' },
    { id: 'valkyrie', name: 'Valkyrie Helm', icon: '🪖', price: '1,000 V$' },
    { id: 'chef', name: 'Chef Hat', icon: '👨‍🍳', price: '40 Tix' },
    { id: 'teapot', name: 'Teapot Hat', icon: '🫖', price: '100 Tix' },
    { id: 'visor', name: 'Verlex  Visor', icon: '🥽', price: '25 Tix' },
    { id: 'blockhead', name: 'Propeller Beanie', icon: '🚁', price: '30 Tix' },
    { id: 'bandana', name: 'Red Bandana', icon: '🧣', price: '20 Tix' },
    { id: 'horns', name: 'Demon Horns', icon: '😈', price: '80 V$' },
  ];

  const faceOptions: { id: AvatarFace; name: string; icon: string }[] = [
    { id: 'smile', name: 'Default Smile ()', icon: '🙂' },
    { id: 'smirk', name: 'Smirk', icon: '😏' },
    { id: 'check_it', name: 'Check It', icon: '😎' },
    { id: 'determined', name: 'Determined', icon: '😠' },
    { id: 'oops', name: 'Oof / Shocked', icon: '😮' },
    { id: 'cool', name: 'Sunglasses', icon: '🕶️' },
    { id: 'epic', name: 'Epic Face', icon: '😆' },
  ];

  const tshirtOptions: { id: AvatarTShirt; name: string; icon: string }[] = [
    { id: 'verlex_v', name: ' Red V', icon: '🔴' },
    { id: 'verlex_logo', name: 'VERLEX Logo', icon: '🟥' },
    { id: 'bloxxer', name: 'Bloxxer 100 KO', icon: '⚔️' },
    { id: 'builder', name: 'Master Builder', icon: '🔨' },
    { id: 'brick_smith', name: 'BrickSmith Guild', icon: '🏛️' },
    { id: 'happy', name: 'Smiley Badge', icon: '⭐' },
    { id: 'none', name: 'Plain (No Decal)', icon: '⬜' },
  ];

  const resetToNoob = () => {
    sounds.playClick();
    onChangeConfig({
      headColor: '#f5cd2f',
      torsoColor: '#0d69ac',
      leftArmColor: '#f5cd2f',
      rightArmColor: '#f5cd2f',
      leftLegColor: '#a4bd46',
      rightLegColor: '#a4bd46',
      face: 'smile',
      hat: 'verlex_cap',
      tshirt: 'verlex_v',
    });
  };

  return (
    <div id="my-verlex-wardrobe" className="w-full bg-[#efefef] min-h-[calc(100vh-140px)] py-4 px-2 sm:px-6 select-none font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Profile Banner */}
        <div className="bg-white border border-gray-400 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-700 border-2 border-blue-900 flex items-center justify-center text-white text-2xl font-black rounded-xs shadow-xs">
              V
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1e3d7a] flex items-center gap-2">
                My VERLEX &ndash; {playerName}
                <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                  {verbucks.toLocaleString()} V$
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-400 px-2.5 py-0.5 rounded-full font-bold">
                  {tix} TIX
                </span>
                {tix >= 10 && (
                  <button 
                    onClick={() => {
                      sounds.playClick();
                      const res = economyService.convertTixToVerbucks();
                      alert(res.message);
                    }}
                    className="text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-2 py-0.5 rounded shadow-sm font-bold border border-indigo-700 cursor-pointer"
                  >
                    Convert TIX to V$
                  </button>
                )}
              </h1>
              <div className="text-xs text-gray-600 flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5">
                <span className="text-emerald-600 font-bold">● Status: Active</span>
                <span>|</span>
                <span>Account Time: <strong className="text-gray-900 font-bold">{economyService.getFormattedAccountAge()} (Day {daysPlayed})</strong> (+100 V$/24h)</span>
                <span>|</span>
                <span>Total Playtime: <strong className="text-gray-900 font-mono font-bold">{playtime}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canClaimDaily && (
              <button
                onClick={handleClaimDaily}
                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 border border-yellow-300 font-black text-xs text-black shadow-md hover:brightness-105 active:translate-y-0.5 cursor-pointer flex items-center space-x-1 animate-pulse"
                title={`Claim your Account Time Allowance (+${economyService.getUnclaimedAllowanceAmount()} V$)`}
              >
                <Gift className="w-3.5 h-3.5 text-gray-900" />
                <span>Claim +{economyService.getUnclaimedAllowanceAmount()} V$ Account Allowance</span>
              </button>
            )}

            <button
              onClick={resetToNoob}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 border border-gray-500 font-bold text-xs text-gray-800 shadow-xs cursor-pointer"
            >
              Reset to Noob Preset
            </button>
            <button
              onClick={onPlayPersonalPlace}
              className="px-4 py-1 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] border border-[#b87d00] font-black text-xs text-black shadow-xs hover:brightness-105 active:translate-y-0.5 cursor-pointer"
            >
              ▶ Visit My Personal Place
            </button>
          </div>
        </div>

        {/* Customizer Layout: 3D Model on Left, Wardrobe Tabs on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Left Column: 3D Interactive Avatar */}
          <div className="md:col-span-5 bg-white border border-gray-400 p-4 shadow-xs flex flex-col items-center justify-between">
            <div className="w-full text-center border-b border-gray-200 pb-2">
              <h3 className="font-bold text-sm text-[#1e3d7a]">
                3D Character Preview
              </h3>
              <p className="text-[11px] text-gray-500">
                Click &amp; drag to rotate your 3D Verlexian
              </p>
            </div>

            <div className="w-full h-80 my-2 relative bg-gradient-to-b from-[#eaf4fc] via-[#d0e6f7] to-[#b4d5ee] border border-blue-200 overflow-hidden flex items-center justify-center shadow-inner rounded-xs">
              <AvatarPreview
                config={avatarConfig}
                name={playerName}
                width="100%"
                height="100%"
                interactive={true}
                autoRotate={false}
              />
            </div>

            {/* Body Part Quick Selectors Diagram */}
            <div className="w-full bg-[#f6f6f6] border border-gray-300 p-2 text-xs">
              <div className="font-bold text-gray-700 text-[11px] mb-1 text-center">
                Click a body part to paint its color:
              </div>
              <div className="flex flex-col items-center space-y-1">
                {/* Head */}
                <button
                  onClick={() => setSelectedBodyPart('headColor')}
                  className={`w-14 py-1 text-center font-bold text-xs rounded-xs border cursor-pointer ${
                    selectedBodyPart === 'headColor' ? 'bg-yellow-400 border-black shadow-sm ring-2 ring-blue-500' : 'bg-gray-200 border-gray-400'
                  }`}
                >
                  Head
                </button>

                {/* Torso & Arms */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedBodyPart('leftArmColor')}
                    className={`w-14 py-3 text-center font-bold text-[10px] rounded-xs border cursor-pointer ${
                      selectedBodyPart === 'leftArmColor' ? 'bg-yellow-400 border-black shadow-sm ring-2 ring-blue-500' : 'bg-gray-200 border-gray-400'
                    }`}
                  >
                    L. Arm
                  </button>

                  <button
                    onClick={() => setSelectedBodyPart('torsoColor')}
                    className={`w-20 py-3 text-center font-bold text-xs rounded-xs border cursor-pointer ${
                      selectedBodyPart === 'torsoColor' ? 'bg-blue-400 text-white border-black shadow-sm ring-2 ring-blue-500' : 'bg-gray-200 border-gray-400'
                    }`}
                  >
                    Torso
                  </button>

                  <button
                    onClick={() => setSelectedBodyPart('rightArmColor')}
                    className={`w-14 py-3 text-center font-bold text-[10px] rounded-xs border cursor-pointer ${
                      selectedBodyPart === 'rightArmColor' ? 'bg-yellow-400 border-black shadow-sm ring-2 ring-blue-500' : 'bg-gray-200 border-gray-400'
                    }`}
                  >
                    R. Arm
                  </button>
                </div>

                {/* Legs */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedBodyPart('leftLegColor')}
                    className={`w-12 py-3 text-center font-bold text-[10px] rounded-xs border cursor-pointer ${
                      selectedBodyPart === 'leftLegColor' ? 'bg-green-500 text-white border-black shadow-sm ring-2 ring-blue-500' : 'bg-gray-200 border-gray-400'
                    }`}
                  >
                    L. Leg
                  </button>

                  <button
                    onClick={() => setSelectedBodyPart('rightLegColor')}
                    className={`w-12 py-3 text-center font-bold text-[10px] rounded-xs border cursor-pointer ${
                      selectedBodyPart === 'rightLegColor' ? 'bg-green-500 text-white border-black shadow-sm ring-2 ring-blue-500' : 'bg-gray-200 border-gray-400'
                    }`}
                  >
                    R. Leg
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Tabs & Palette */}
          <div className="md:col-span-7 bg-white border border-gray-400 p-4 shadow-xs flex flex-col">
            {/* Tab Bar */}
            <div className="flex items-center space-x-1 border-b border-gray-400 pb-2 text-xs font-bold">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('colors');
                }}
                className={`px-3 py-1.5 border border-b-0 cursor-pointer ${
                  activeTab === 'colors' ? 'bg-[#5c87de] text-white border-[#1e3d7a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400'
                }`}
              >
                🎨 Body Colors
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('hats');
                }}
                className={`px-3 py-1.5 border border-b-0 cursor-pointer ${
                  activeTab === 'hats' ? 'bg-[#5c87de] text-white border-[#1e3d7a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400'
                }`}
              >
                🎩 Hats &amp; Helmets
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('faces');
                }}
                className={`px-3 py-1.5 border border-b-0 cursor-pointer ${
                  activeTab === 'faces' ? 'bg-[#5c87de] text-white border-[#1e3d7a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400'
                }`}
              >
                😀 Faces
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('tshirts');
                }}
                className={`px-3 py-1.5 border border-b-0 cursor-pointer ${
                  activeTab === 'tshirts' ? 'bg-[#5c87de] text-white border-[#1e3d7a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400'
                }`}
              >
                👕 T-Shirts
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('economy');
                }}
                className={`px-3 py-1.5 border border-b-0 cursor-pointer flex items-center space-x-1 ${
                  activeTab === 'economy' ? 'bg-[#1e3d7a] text-white border-blue-900' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-400 font-extrabold'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>💰 V$ Economy</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="pt-4 flex-1">
              {/* COLORS TAB */}
              {activeTab === 'colors' && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-700 font-medium">
                    Selecting color for <span className="font-black text-[#003399] uppercase">{selectedBodyPart.replace('Color', '')}</span>:
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                    {VERLEX_CLASSIC_COLORS.map((col) => {
                      const isSelected = avatarConfig[selectedBodyPart] === col.hex;
                      return (
                        <button
                          key={col.hex}
                          onClick={() => {
                            sounds.playClick();
                            onChangeConfig({ [selectedBodyPart]: col.hex });
                          }}
                          className={`p-2 border rounded-xs flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                            isSelected ? 'border-blue-700 ring-2 ring-blue-500 shadow-md bg-blue-50' : 'border-gray-400 hover:border-gray-600 bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-xs border border-gray-800 shadow-inner"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-[10px] font-bold text-gray-800 truncate text-center w-full">
                            {col.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* HATS TAB */}
              {activeTab === 'hats' && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-700 font-medium">
                    Equip iconic hats &amp; accessories:
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {hatOptions.map((hat) => {
                      const isEquipped = avatarConfig.hat === hat.id;
                      return (
                        <div
                          key={hat.id}
                          onClick={() => {
                            sounds.playClick();
                            onChangeConfig({ hat: hat.id });
                          }}
                          className={`p-2.5 border rounded-xs flex flex-col justify-between items-center text-center cursor-pointer transition-all ${
                            isEquipped ? 'border-blue-700 ring-2 ring-blue-500 bg-blue-50 shadow-md' : 'border-gray-400 hover:border-gray-600 bg-gray-50'
                          }`}
                        >
                          <div className="text-3xl my-1">{hat.icon}</div>
                          <div className="font-bold text-xs text-gray-800">{hat.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{hat.price}</div>
                          <button
                            className={`mt-2 w-full py-0.5 text-[10px] font-bold rounded-xs border cursor-pointer ${
                              isEquipped ? 'bg-green-600 text-white border-green-800' : 'bg-gray-200 text-gray-800 border-gray-400'
                            }`}
                          >
                            {isEquipped ? '✓ Equipped' : 'Equip'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FACES TAB */}
              {activeTab === 'faces' && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-700 font-medium">
                    Choose your Verlex face decal:
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {faceOptions.map((face) => {
                      const isEquipped = avatarConfig.face === face.id;
                      return (
                        <div
                          key={face.id}
                          onClick={() => {
                            sounds.playClick();
                            onChangeConfig({ face: face.id });
                          }}
                          className={`p-2.5 border rounded-xs flex flex-col justify-between items-center text-center cursor-pointer transition-all ${
                            isEquipped ? 'border-blue-700 ring-2 ring-blue-500 bg-blue-50 shadow-md' : 'border-gray-400 hover:border-gray-600 bg-gray-50'
                          }`}
                        >
                          <div className="text-3xl my-1">{face.icon}</div>
                          <div className="font-bold text-xs text-gray-800">{face.name}</div>
                          <button
                            className={`mt-2 w-full py-0.5 text-[10px] font-bold rounded-xs border cursor-pointer ${
                              isEquipped ? 'bg-green-600 text-white border-green-800' : 'bg-gray-200 text-gray-800 border-gray-400'
                            }`}
                          >
                            {isEquipped ? '✓ Equipped' : 'Equip'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ECONOMY & MONETIZATION TAB */}
              {activeTab === 'economy' && (
                <div className="space-y-4">
                  
                  {/* Notice Banner */}
                  {notice && (
                    <div
                      className={`p-2.5 px-4 text-xs font-bold rounded-xs flex items-center space-x-2 ${
                        notice.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-400' : 'bg-red-100 text-red-800 border border-red-400'
                      }`}
                    >
                      {notice.type === 'success' ? <Sparkles className="w-4 h-4 text-emerald-600" /> : <Gift className="w-4 h-4 text-red-600" />}
                      <span>{notice.text}</span>
                    </div>
                  )}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-3.5 border border-emerald-600 rounded-xs shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Verbucks Balance</div>
                        <div className="text-2xl font-black font-mono text-emerald-400 mt-1 flex items-center gap-1">
                          <Coins className="w-6 h-6 text-amber-400" />
                          <span>{verbucks} V$</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-200 mt-2">
                        Start with 0 V$ &bull; Earn 100 V$ / 24h Account Time
                      </div>
                    </div>

                    <div className="bg-white p-3.5 border border-gray-300 rounded-xs shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Account Time &amp; Reward</div>
                        <div className="text-xl font-extrabold text-[#1e3d7a] mt-1">
                          Day {daysPlayed} ({economyService.getFormattedAccountAge()})
                        </div>
                      </div>
                      {canClaimDaily ? (
                        <button
                          onClick={handleClaimDaily}
                          className="mt-2 w-full py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 border border-amber-600 text-black font-black text-xs rounded-xs shadow-xs hover:brightness-105 active:translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Claim +{economyService.getUnclaimedAllowanceAmount()} V$ (Account Time)</span>
                        </button>
                      ) : (
                        <div className="mt-2 text-[11px] text-gray-500 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Allowance Claimed (Next in {economyService.getNextAllowanceCountdown()})</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-3.5 border border-gray-300 rounded-xs shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Passes Monetized</div>
                        <div className="text-xl font-extrabold text-blue-900 mt-1">
                          {createdPasses.length} Active Passes
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2">
                        Earn 100% of V$ when players buy your Game Passes!
                      </div>
                    </div>
                  </div>

                  {/* Create Game Pass Section */}
                  <div className="bg-blue-50/80 border-2 border-blue-400 p-4 rounded-xs shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                      <h3 className="font-black text-sm text-[#1e3d7a] flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-amber-500" />
                        <span>Monetize Your Game: Create a Game Pass</span>
                      </h3>
                      <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                        Earn V$ Revenue
                      </span>
                    </div>

                    <form onSubmit={handleCreatePass} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Select Place / Game</label>
                          <select
                            value={newPassGame}
                            onChange={(e) => setNewPassGame(e.target.value)}
                            className="w-full p-2 bg-white border border-gray-400 rounded-xs font-bold text-gray-800"
                          >
                            <option value="personal_place">🏠 My Personal Place ({playerName}'s Place)</option>
                            <option value="crossroads">⚔️ Crossroads</option>
                            <option value="chaos_canyon">💣 Chaos Canyon</option>
                            <option value="haunted_mansion">👻 Haunted Mansion</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Pass Name *</label>
                          <input
                            type="text"
                            value={newPassName}
                            onChange={(e) => setNewPassName(e.target.value)}
                            placeholder="e.g. Gravity Coil, Speed Boost, VIP Sword"
                            className="w-full p-2 bg-white border border-gray-400 rounded-xs font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                            maxLength={30}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Price in Verbucks (V$) *</label>
                          <input
                            type="number"
                            value={newPassPrice}
                            onChange={(e) => setNewPassPrice(Math.max(1, parseInt(e.target.value) || 0))}
                            min={1}
                            max={5000}
                            className="w-full p-2 bg-white border border-gray-400 rounded-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-1">In-Game Perk Power</label>
                          <select
                            value={newPassPerk}
                            onChange={(e) => setNewPassPerk(e.target.value as any)}
                            className="w-full p-2 bg-white border border-gray-400 rounded-xs font-bold text-gray-800"
                          >
                            <option value="speed_coil">⚡ Speed Coil (+50% Walk Speed)</option>
                            <option value="gravity_coil">🌀 Gravity Coil (High Jump)</option>
                            <option value="golden_sword">⚔️ VIP Golden Sword (+50% Slash Damage)</option>
                            <option value="jetpack">🚀 Super Rocket Jetpack</option>
                            <option value="double_jump">👟 High Jump Boots</option>
                            <option value="lava_shield">🛡️ Lava Immunity Shield</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1 text-xs">Description</label>
                        <input
                          type="text"
                          value={newPassDesc}
                          onChange={(e) => setNewPassDesc(e.target.value)}
                          placeholder="What benefit does this pass give players in your game?"
                          className="w-full p-2 bg-white border border-gray-400 rounded-xs text-xs text-gray-800"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-gradient-to-b from-[#5c87de] to-[#2d5dbd] text-white font-extrabold text-xs border border-[#1e3d7a] rounded-xs shadow-xs hover:brightness-110 cursor-pointer flex items-center space-x-1"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Publish Game Pass to Earn V$</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* My Created Game Passes */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
                      My Published Game Passes &amp; Revenue ({createdPasses.length})
                    </h3>

                    {createdPasses.length === 0 ? (
                      <div className="bg-white border border-gray-300 p-6 text-center text-gray-500 text-xs">
                        You haven't created any Game Passes yet. Create one above to start earning Verbucks from players visiting your games!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {createdPasses.map((pass) => (
                          <div key={pass.id} className="bg-white border border-gray-300 p-3 rounded-xs shadow-xs flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">{pass.icon}</span>
                                  <div>
                                    <h4 className="font-bold text-xs text-[#1e3d7a]">{pass.name}</h4>
                                    <div className="text-[10px] text-gray-500">Listed on {pass.gameTitle}</div>
                                  </div>
                                </div>

                                <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                                  {pass.priceVBucks} V$
                                </span>
                              </div>

                              <p className="text-[11px] text-gray-600 mt-1.5">{pass.description}</p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between text-[11px]">
                              <span className="font-bold text-gray-700">Total Sales: {pass.salesCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Transaction History Log */}
                  <div className="bg-white border border-gray-300 p-3 rounded-xs space-y-2">
                    <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider flex items-center space-x-1">
                      <History className="w-3.5 h-3.5 text-gray-500" />
                      <span>Recent V$ Transactions Log</span>
                    </h3>

                    {transactions.length === 0 ? (
                      <div className="text-xs text-gray-500 italic py-2">No transaction activity recorded yet.</div>
                    ) : (
                      <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto pr-1">
                        {transactions.slice(0, 10).map((tx) => (
                          <div key={tx.id} className="py-1.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-gray-800">{tx.description}</span>
                              <div className="text-[10px] text-gray-400">{tx.timestamp}</div>
                            </div>

                            <span
                              className={`font-mono font-black ${
                                tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} V$
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
