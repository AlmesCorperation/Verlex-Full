import React, { useState } from 'react';
import { AvatarConfig, GameServer, MapTemplateId } from '../types';
import { AvatarPreview } from './AvatarPreview';
import { sounds } from '../game/soundEngine';
import { serverRegistry } from '../services/serverRegistry';
import { Radio, ShieldCheck, Play, ArrowRight, ArrowDown, ChevronDown, Sparkles } from 'lucide-react';

interface HomePageProps {
  avatarConfig: AvatarConfig;
  playerName: string;
  isLoggedIn: boolean;
  onLogin: (name: string) => void;
  onOpenLoginModal: () => void;
  onLaunchGame: (mapId: MapTemplateId) => void;
  onJoinServer: (server: GameServer) => void;
  onOpenServerBrowser: (mapId?: MapTemplateId) => void;
  onNavigateToAvatar: () => void;
  onNavigateToGames: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  avatarConfig,
  playerName,
  isLoggedIn,
  onLogin,
  onOpenLoginModal,
  onLaunchGame,
  onJoinServer,
  onOpenServerBrowser,
  onNavigateToAvatar,
  onNavigateToGames,
}) => {
  const [loginInputName, setLoginInputName] = useState<string>('');
  const [loginInputPass, setLoginInputPass] = useState<string>('••••••••');
  const [homeJoinCode, setHomeJoinCode] = useState<string>('');

  const handleSidebarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInputName.trim()) {
      onOpenLoginModal();
      return;
    }
    sounds.playClick();
    onLogin(loginInputName.trim());
  };

  const handleHomeDirectJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeJoinCode.trim()) return;

    sounds.playClick();
    const clean = homeJoinCode.trim().toUpperCase();
    const found = serverRegistry.findServerByCode(clean);

    if (found) {
      onJoinServer(found);
    } else {
      let guessedMap: MapTemplateId = 'crossroads';
      if (clean.startsWith('CR-')) guessedMap = 'crossroads';
      else if (clean.startsWith('CC-')) guessedMap = 'physics_lab';
      else if (clean.startsWith('HH-')) guessedMap = 'happy_home';
      else if (clean.startsWith('BP-')) guessedMap = 'baseplate';
      else if (clean.startsWith('OB-')) guessedMap = 'obby';

      onJoinServer({
        id: `srv_direct_${Date.now()}`,
        roomCode: clean,
        mapId: guessedMap,
        name: `Server [${clean}]`,
        hostName: 'Peer_Host',
        playerCount: 1,
        maxPlayers: 12,
        region: 'P2P',
        ping: 25,
        createdAt: Date.now(),
      });
    }
  };

  const coolPlaces: {
    id: MapTemplateId;
    title: string;
    creator: string;
    defaultCode: string;
    players: number;
    description: string;
    previewGradient: string;
    iconText: string;
  }[] = [
    {
      id: 'crossroads',
      title: 'Crossroads',
      creator: 'Verlex',
      defaultCode: 'CR-777',
      players: 0,
      description: 'The iconic  BrickBattle arena with towers, bridges, swords, and rockets.',
      previewGradient: 'from-[#4a6b82] via-[#2c3e50] to-[#1a252f]',
      iconText: '🏰',
    },
    {
      id: 'physics_lab',
      title: 'Chaos Canyon',
      creator: 'Telamon',
      defaultCode: 'CC-4012',
      players: 0,
      description: 'Canyon battleground featuring high bridges, cannons, and destructive bricks.',
      previewGradient: 'from-[#d35400] via-[#e67e22] to-[#f39c12]',
      iconText: '🏜️',
    },
    {
      id: 'happy_home',
      title: 'Happy Home in Verlexia',
      creator: 'Shedletsky',
      defaultCode: 'HH-1024',
      players: 0,
      description: 'yellow brick home on green lawns. The quintessential first place.',
      previewGradient: 'from-[#27ae60] via-[#2ecc71] to-[#3498db]',
      iconText: '🏡',
    },
    {
      id: 'baseplate',
      title: 'Baseplate Builder',
      creator: 'Builderman',
      defaultCode: 'BP-1337',
      players: 0,
      description: 'Massive stud baseplate for free-form brick placement and Newtonian physics.',
      previewGradient: 'from-[#7f8c8d] via-[#95a5a6] to-[#bdc3c7]',
      iconText: '🧱',
    },
    {
      id: 'obby',
      title: 'Verlex Obstacle Course',
      creator: 'Clockwork',
      defaultCode: 'OB-7788',
      players: 0,
      description: ' platforming challenge with lava studs, trampolines, and spinners.',
      previewGradient: 'from-[#8e44ad] via-[#9b59b6] to-[#2c3e50]',
      iconText: '🏃',
    },
  ];

  const scrollSections = React.useMemo(() => [
    { id: 'home-main-showcase', label: 'Top / Play' },
    { id: 'home-sidebar-join', label: 'Join Code' },
    { id: 'home-avatar-card', label: 'Avatar' },
    { id: 'cool-places-section', label: 'Cool Places' },
  ], []);

  const [activeScrollIdx, setActiveScrollIdx] = useState(0);

  React.useEffect(() => {
    // 1. Keyboard Navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveScrollIdx((prev) => {
          const next = Math.min(prev + 1, scrollSections.length - 1);
          scrollToSection(scrollSections[next].id);
          return next;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveScrollIdx((prev) => {
          const next = Math.max(prev - 1, 0);
          scrollToSection(scrollSections[next].id);
          return next;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    // 2. Mouse Scroll Sync (Intersection Observer)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = scrollSections.findIndex(sec => sec.id === entry.target.id);
            if (index !== -1) {
              setActiveScrollIdx(index);
            }
          }
        });
      },
      { threshold: 0.5 } // 50% of the section must be visible
    );

    scrollSections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, [scrollSections]);

  const scrollToSection = (sectionId: string) => {
    sounds.playClick();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      id="verlex-home-page" 
      className="w-full bg-[#efefef] min-h-[calc(100vh-140px)] py-4 px-2 sm:px-6 select-none font-sans text-gray-800 relative"
    >
      {/* Chromebook Quick Screen-Scroller Bar */}
      <div className="max-w-6xl mx-auto mb-3 bg-[#e0e8f5] border border-[#a4c0e4] px-3 py-1.5 rounded flex items-center justify-between text-xs text-[#1e3d7a] shadow-xs sticky top-0 z-20">
        <div className="flex items-center space-x-2 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Home Menu Scroller:</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-[11px] font-semibold">
          {scrollSections.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveScrollIdx(idx);
                scrollToSection(sec.id);
              }}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer border ${
                activeScrollIdx === idx 
                  ? 'bg-[#1e3d7a] text-white border-[#1e3d7a]' 
                  : 'bg-white hover:bg-blue-50 border-blue-300 text-[#1e3d7a]'
              }`}
            >
              {sec.label}
              {sec.id === 'cool-places-section' && <ChevronDown className="w-3 h-3 inline ml-1" />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Main Grid: Left Column (Login + Avatar + Join Code) & Right Column (Virtual Playworld + Hero CTA) */}
        <div id="home-main-showcase" className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Left Sidebar Column (Cols 1-3) */}
          <aside className="md:col-span-3 space-y-3 flex flex-col items-center">
            
            {/* Member Login Card */}
            {!isLoggedIn ? (
              <div id="home-login-card" className="w-full bg-white border border-gray-400 p-3 shadow-xs">
                <div className="bg-[#305a9c] text-white text-xs font-bold px-2 py-1 flex items-center justify-between mb-2">
                  <span>Member Login</span>
                  <span className="text-[10px] text-blue-200">VERLEX</span>
                </div>

                <form onSubmit={handleSidebarLogin} className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">Username:</label>
                    <input
                      id="home-username-input"
                      type="text"
                      value={loginInputName}
                      onChange={(e) => setLoginInputName(e.target.value)}
                      placeholder="Player Name"
                      className="w-full text-xs px-2 py-1 border border-gray-400 bg-[#fffde8] font-sans focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">Password:</label>
                    <input
                      id="home-password-input"
                      type="password"
                      value={loginInputPass}
                      onChange={(e) => setLoginInputPass(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-400 bg-[#fffde8] font-sans focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      id="home-submit-login-btn"
                      type="submit"
                      className="bg-[#5c87de] hover:bg-[#4a73c5] text-white font-bold text-xs px-3 py-1 border border-[#1e3d7a] shadow-xs active:translate-y-0.5 cursor-pointer"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={onOpenLoginModal}
                      className="text-[11px] text-[#003399] hover:underline cursor-pointer"
                    >
                      Sign Up &gt;
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="w-full bg-white border border-gray-400 p-3 shadow-xs">
                <div className="bg-[#305a9c] text-white text-xs font-bold px-2 py-1 mb-2">
                  <span>Welcome back!</span>
                </div>
                <div className="text-center py-1">
                  <span className="text-xs font-bold text-gray-800">{playerName}</span>
                  <div className="text-[11px] text-emerald-600 font-bold mt-0.5">● Online in Verlex</div>
                </div>
              </div>
            )}

            {/* Direct Join Code Fast-Box */}
            <div id="home-sidebar-join" className="w-full bg-white border border-emerald-600 shadow-xs p-2.5">
              <div className="bg-emerald-800 text-white text-xs font-bold px-2 py-1 flex items-center justify-between mb-2">
                <span className="flex items-center space-x-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Direct Join Code</span>
                </span>
                <span className="text-[10px] text-emerald-200">P2P</span>
              </div>

              <form onSubmit={handleHomeDirectJoin} className="space-y-2">
                <div className="text-[10px] text-gray-600">
                  Enter a friend's server code (e.g. <span className="font-mono font-bold text-emerald-700">CR-777</span>):
                </div>
                <div className="flex space-x-1">
                  <input
                    id="home-join-code-input"
                    type="text"
                    value={homeJoinCode}
                    onChange={(e) => setHomeJoinCode(e.target.value.toUpperCase())}
                    placeholder="CR-777"
                    className="w-full text-xs px-2 py-1 border border-emerald-600 bg-emerald-50 font-mono font-bold uppercase focus:outline-none focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 border border-emerald-800 shadow-xs cursor-pointer active:translate-y-0.5"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>

            {/* 3D Verlexian Character Preview */}
            <div id="home-avatar-card" className="w-full bg-white border border-gray-400 shadow-xs p-2 flex flex-col items-center">
              <div className="w-full h-52 relative bg-gradient-to-b from-[#eaf4fc] to-[#d0e6f7] border border-blue-200 overflow-hidden flex items-center justify-center">
                <AvatarPreview
                  config={avatarConfig}
                  name={playerName}
                  width="100%"
                  height="100%"
                  interactive={true}
                  autoRotate={true}
                />
              </div>

              <div className="w-full mt-2 text-center">
                <button
                  onClick={onNavigateToAvatar}
                  className="text-xs font-bold text-[#003399] hover:underline flex items-center justify-center mx-auto space-x-1 cursor-pointer"
                >
                  <span>Customize Avatar</span>
                  <span>&gt;</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Main Showcase (Cols 4-12) */}
          <main className="md:col-span-9 bg-white border border-gray-400 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              {/* Title & Subtitle */}
              <div className="border-b-2 border-gray-200 pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#1e3d7a] tracking-tight font-serif">
                    VERLEX Virtual Playworld
                  </h1>
                  <h2 className="text-sm sm:text-base font-bold text-[#333333] mt-0.5">
                    VERLEX is Free! P2P Multiplayer Enabled.
                  </h2>
                </div>

                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenServerBrowser('all');
                  }}
                  className="px-3 py-1.5 bg-[#5c87de] hover:bg-[#4a73c5] text-white font-bold text-xs border border-[#1e3d7a] flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Server Browser &amp; Join Codes</span>
                </button>
              </div>

              {/* Middle Section: 3 Numbered Feature Blocks on Left + Big Hero Graphic on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                
                {/* 3 Feature Rows (Left 6 Cols) */}
                <div className="lg:col-span-6 space-y-3.5">
                  
                  {/* Feature 1 */}
                  <div className="flex items-start space-x-3 group cursor-pointer" onClick={() => onLaunchGame('baseplate')}>
                    <div className="shrink-0 w-11 h-11 bg-gradient-to-br from-[#4a90e2] via-[#2070d0] to-[#0c4ca3] border-2 border-[#093570] text-white font-black text-xl flex items-center justify-center shadow-[2px_3px_0verlex_rgba(0,0,0,0.3)] rounded-xs transform -rotate-2 group-hover:scale-105 transition-transform">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1e3d7a] group-hover:underline">
                        Build your personal Place
                      </h3>
                      <p className="text-xs text-gray-600 leading-snug mt-0.5">
                        Create buildings, vehicles, scenery, and physics structures with thousands of virtual bricks.
                      </p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start space-x-3 group cursor-pointer" onClick={onNavigateToGames}>
                    <div className="shrink-0 w-11 h-11 bg-gradient-to-br from-[#4a90e2] via-[#2070d0] to-[#0c4ca3] border-2 border-[#093570] text-white font-black text-xl flex items-center justify-center shadow-[2px_3px_0verlex_rgba(0,0,0,0.3)] rounded-xs transform rotate-1 group-hover:scale-105 transition-transform">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1e3d7a] group-hover:underline">
                        Meet new friends online
                      </h3>
                      <p className="text-xs text-gray-600 leading-snug mt-0.5">
                        Share Join Codes, explore multiplayer servers together in real-time with P2P networking.
                      </p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start space-x-3 group cursor-pointer" onClick={() => onLaunchGame('crossroads')}>
                    <div className="shrink-0 w-11 h-11 bg-gradient-to-br from-[#4a90e2] via-[#2070d0] to-[#0c4ca3] border-2 border-[#093570] text-white font-black text-xl flex items-center justify-center shadow-[2px_3px_0verlex_rgba(0,0,0,0.3)] rounded-xs transform -rotate-1 group-hover:scale-105 transition-transform">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1e3d7a] group-hover:underline">
                        Battle in the Brick Arenas
                      </h3>
                      <p className="text-xs text-gray-600 leading-snug mt-0.5">
                        Play with slingshots, rocket launchers, and sword fights. Watch out for explosions!
                      </p>
                    </div>
                  </div>

                  {/* Web Sandbox Instant Play Info Box */}
                  <div className="pt-2">
                    <div className="w-full bg-[#f0f4f8] border-2 border-[#5c6bc0]/50 rounded-lg p-2.5 text-left shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#1a237e] uppercase tracking-tight">Play Instantly</span>
                        <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold">100% WebGL Sandbox</span>
                      </div>
                      <p className="text-[11px] text-gray-600 font-medium leading-tight mt-1">
                        Runs directly in your browser with zero download needed. Connects over WebRTC P2P Mesh.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hero Showcase Billboard (Right 6 Cols) */}
                <div className="lg:col-span-6 flex flex-col items-center">
                  <div 
                    onClick={() => {
                      sounds.playClick();
                      onLaunchGame('crossroads');
                    }}
                    className="w-full relative bg-gradient-to-b from-[#2e7d32] via-[#388e3c] to-[#1b5e20] border-4 border-[#1b5e20] rounded-sm p-4 text-white shadow-md cursor-pointer overflow-hidden group"
                  >
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:16px_16px]"></div>

                    <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                      <div className="font-serif italic font-black text-3xl sm:text-4xl text-white drop-shadow-[2px_2px_0verlex_rgba(0,0,0,0.8)] tracking-wide">
                        BUILD IT...
                      </div>

                      {/* 3D Black Brick Visual Graphic */}
                      <div className="w-36 h-16 bg-gradient-to-r from-[#222222] via-[#333333] to-[#111111] border-2 border-[#111111] shadow-[0_8px_16pxverlex_rgba(0,0,0,0.6)] rounded-xs flex items-center justify-around px-2 relative group-hover:scale-105 transition-transform">
                        <div className="w-5 h-5 rounded-full bg-[#444] border border-[#222] shadow-inner"></div>
                        <div className="w-5 h-5 rounded-full bg-[#444] border border-[#222] shadow-inner"></div>
                        <div className="w-5 h-5 rounded-full bg-[#444] border border-[#222] shadow-inner"></div>
                        <div className="w-5 h-5 rounded-full bg-[#444] border border-[#222] shadow-inner"></div>
                        
                        <div className="absolute -bottom-3 -right-2 text-2xl drop-shadow-[1px_1px_2pxverlex_rgba(0,0,0,0.9)]">
                          👆
                        </div>
                      </div>

                      {/* Giant Yellow "FREE - Play in Browser!" Button */}
                      <button
                        id="hero-play-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playClick();
                          onLaunchGame('crossroads');
                        }}
                        className="w-full bg-gradient-to-b from-[#ffea6c] via-[#ffd230] to-[#e6a502] hover:from-[#fff089] hover:to-[#f0b010] text-[#2b1e00] font-black text-base sm:text-lg py-2.5 px-4 rounded-sm border-2 border-[#946900] shadow-[inset_0_1px_0verlex_rgba(255,255,255,0.8),_0_4px_8pxverlex_rgba(0,0,0,0.4)] active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer"
                      >
                        FREE &ndash; Play in Browser!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Bottom Section: "Cool Places" */}
        <section id="cool-places-section" className="bg-white border border-gray-400 shadow-xs p-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            <div className="md:col-span-2 bg-[#dcdcdc] p-2.5 border border-gray-400 text-center md:text-left">
              <h4 className="font-serif font-black text-sm text-[#333333]">
                Cool Places
              </h4>
              <p className="text-[11px] text-gray-600 leading-tight mt-1">
                Active server rooms ready with live Join Codes.
              </p>
            </div>

            <div className="md:col-span-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {coolPlaces.map((place) => (
                <div
                  key={place.id}
                  onClick={() => {
                    sounds.playClick();
                    onLaunchGame(place.id);
                  }}
                  className="bg-[#f7f7f7] border border-gray-400 p-1.5 hover:border-blue-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className={`h-20 w-full bg-gradient-to-br ${place.previewGradient} border border-gray-600 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
                      <span className="text-2xl drop-shadow-md">{place.iconText}</span>
                      <span className="text-[10px] font-mono text-white/90 font-bold mt-1 tracking-tight">
                        {place.defaultCode}
                      </span>
                    </div>

                    <div className="mt-1.5">
                      <div className="font-bold text-xs text-[#003399] group-hover:underline truncate" title={place.title}>
                        {place.title}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        by {place.creator}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onLaunchGame(place.id);
                    }}
                    className="mt-2 w-full bg-[#4caf50] hover:bg-[#43a047] text-white font-bold text-[10px] py-1 rounded-xs border border-[#2e7d32] shadow-xs active:translate-y-0.5 cursor-pointer"
                  >
                    ▶ Play ({place.defaultCode})
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
