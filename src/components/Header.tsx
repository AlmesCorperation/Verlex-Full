import React, { useState, useEffect } from 'react';
import { SitePage } from '../types';
import { sounds } from '../game/soundEngine';
import { friendsService } from '../services/friendsService';
import { economyService } from '../services/economyService';
import { Radio, Users, Sparkles, Gift } from 'lucide-react';

interface HeaderProps {
  currentPage: SitePage;
  onNavigate: (page: SitePage) => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
  playerName: string;
  onLogout: () => void;
  onPlayGame: () => void;
  onOpenServers?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenLogin,
  isLoggedIn,
  playerName,
  onLogout,
  onPlayGame,
  onOpenServers,
}) => {
  const getSocialNotificationsCount = () => {
    return friendsService.getUnreadCount() + friendsService.getIncomingRequests().length;
  };

  const [unreadPMs, setUnreadPMs] = useState<number>(getSocialNotificationsCount());
  const [verbucks, setVerbucks] = useState<number>(economyService.getVerbucks());
  const [tix, setTix] = useState<number>(economyService.getTix());
  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(economyService.canClaimDailyAllowance());
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubFriends = friendsService.subscribe(() => {
      setUnreadPMs(getSocialNotificationsCount());
    });
    
    const updateEcon = () => {
      setVerbucks(economyService.getVerbucks());
      setTix(economyService.getTix());
      setCanClaimDaily(economyService.canClaimDailyAllowance());
    };

    updateEcon();
    const unsubEcon = economyService.subscribe(updateEcon);

    return () => {
      unsubFriends();
      unsubEcon();
    };
  }, []);

  const handleClaimDailyHeader = () => {
    sounds.playClick();
    const res = economyService.claimDailyAllowance();
    setClaimFeedback(res.message);
    setTimeout(() => setClaimFeedback(null), 4500);
  };
  return (
    <header id="verlex--header" className="w-full bg-[#525252] text-white select-none border-b-2 border-[#1e3d7a]">
      {/* Top Utility Bar */}
      <div className="bg-[#333333] px-4 py-1 flex items-center justify-between text-xs font-sans text-gray-200 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          {!isLoggedIn ? (
            <button
              id="header-login-btn"
              onClick={() => {
                sounds.playClick();
                onOpenLogin();
              }}
              className="bg-[#5c87de] hover:bg-[#4a73c5] text-white font-bold px-2 py-0.5 border border-white text-xs shadow-sm active:translate-y-0.5 cursor-pointer"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">Welcome,</span>
              <span className="font-bold text-yellow-300">{playerName}</span>
              <span className="text-gray-400">|</span>
              <button
                id="header-logout-btn"
                onClick={() => {
                  sounds.playClick();
                  onLogout();
                }}
                className="text-gray-300 hover:text-white underline cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {onOpenServers && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenServers();
              }}
              className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>P2P Servers &amp; Join Codes</span>
            </button>
          )}

          <div className="flex items-center space-x-1" title="Tickets (TIX)">
            <span className="text-yellow-400 font-bold">TIX:</span>
            <span className="bg-[#222] px-1.5 py-0.5 border border-gray-600 text-yellow-300 font-mono font-bold">{tix}</span>
          </div>

          <div className="flex items-center space-x-1 cursor-pointer" onClick={() => onNavigate('my_verlex')} title="Verbucks (V$) - Click to manage economy">
            <span className="text-emerald-400 font-black">V$:</span>
            <span className="bg-[#111] px-2 py-0.5 border border-emerald-600/80 text-emerald-300 font-mono font-black text-xs shadow-xs">
              {verbucks.toLocaleString()} V$
            </span>
          </div>

          {canClaimDaily ? (
            <button
              onClick={handleClaimDailyHeader}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-gray-950 font-black px-2.5 py-0.5 rounded-xs border border-yellow-300 shadow-md flex items-center space-x-1 animate-pulse cursor-pointer"
              title={`Claim your Account Time Allowance (+${economyService.getUnclaimedAllowanceAmount()} V$)`}
            >
              <Gift className="w-3.5 h-3.5 text-gray-900" />
              <span>Claim +{economyService.getUnclaimedAllowanceAmount()} V$</span>
            </button>
          ) : (
            <span className="hidden md:inline text-[11px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 rounded-xs" title={`Account Time Allowance claimed. Next +100 V$ unlocks in ${economyService.getNextAllowanceCountdown()}`}>
              ✓ Account Allowance Claimed
            </span>
          )}
        </div>
      </div>

      {claimFeedback && (
        <div className="bg-emerald-600 text-white font-black text-xs px-4 py-1.5 text-center shadow-md border-b border-emerald-800 flex items-center justify-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>{claimFeedback}</span>
        </div>
      )}

      {/* Main Banner Header */}
      <div className="relative bg-gradient-to-b from-[#87ceeb] via-[#b4e0f7] to-[#7db9e8] px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between overflow-hidden border-b border-[#305a9c]">
        {/* Verlex Pixel Landscape */}
        <div className="absolute inset-0 pointer-events-none opacity-40 flex items-end justify-between px-10">
          <div className="w-16 h-12 bg-green-700 rounded-t-full -mb-3 opacity-60"></div>
          <div className="w-24 h-16 bg-green-600 rounded-t-full -mb-4 opacity-50"></div>
          <div className="w-20 h-10 bg-yellow-600 rounded-t-full -mb-2 opacity-40"></div>
          <div className="w-28 h-14 bg-green-800 rounded-t-full -mb-3 opacity-50"></div>
        </div>

        {/* Center/Left Logo & Subtitle */}
        <div className="relative z-10 flex flex-col items-start cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="flex items-center space-x-2">
            <div className="flex items-center tracking-tight font-black text-4xl sm:text-5xl drop-shadow-[2px_3px_0pxverlex_rgba(0,0,0,0.8)] select-none">
              <span className="text-[#e62020] [text-shadow:_2px_2px_0_#900,_3px_3px_0_#000]">V</span>
              <span className="text-[#e62020] [text-shadow:_2px_2px_0_#900,_3px_3px_0_#000]">E</span>
              <span className="text-[#e62020] [text-shadow:_2px_2px_0_#900,_3px_3px_0_#000] inline-block -rotate-6">R</span>
              <span className="text-[#e62020] [text-shadow:_2px_2px_0_#900,_3px_3px_0_#000]">L</span>
              <span className="text-[#e62020] [text-shadow:_2px_2px_0_#900,_3px_3px_0_#000]">E</span>
              <span className="text-[#e62020] [text-shadow:_2px_2px_0_#900,_3px_3px_0_#000]">X</span>
            </div>
          </div>
          <span className="text-[#8b0000] font-bold text-xs sm:text-sm italic tracking-wide mt-0.5 [text-shadow:_0_1px_1pxverlex_rgba(255,255,255,0.8)]">
             Physics &amp; Brick Sandbox
          </span>
        </div>

        {/* Top-Right Big CTA Buttons */}
        <div className="relative z-10 mt-2 sm:mt-0 flex flex-wrap items-center gap-2">
          <button
            id="header-signup-play-btn"
            onClick={() => {
              sounds.playClick();
              onPlayGame();
            }}
            className="bg-gradient-to-b from-[#ffd84d] via-[#f7c229] to-[#df9e0c] hover:from-[#ffe066] hover:to-[#e6a815] text-[#332200] font-black text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-sm border-2 border-[#b87d00] shadow-[inset_0_1px_0verlex_rgba(255,255,255,0.7),_2px_3px_5pxverlex_rgba(0,0,0,0.35)] active:translate-y-0.5 active:shadow-none flex items-center space-x-1.5 transition-transform cursor-pointer"
          >
            <span>Play in Browser</span>
            <span className="text-base font-mono">&gt;</span>
          </button>
        </div>
      </div>

      {/* Sky-Blue Navigation Bar */}
      <nav className="bg-gradient-to-b from-[#5c87de] via-[#4d75c9] to-[#3f63b0] px-2 sm:px-4 py-1.5 flex items-center justify-start sm:justify-center overflow-x-auto text-xs sm:text-sm font-bold shadow-inner whitespace-nowrap scrollbar-thin">
        <div className="flex items-center space-x-1 sm:space-x-3 text-white">
          <button
            id="nav-my-verlex"
            onClick={() => {
              sounds.playClick();
              onNavigate('my_verlex');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer ${
              currentPage === 'my_verlex' ? 'text-yellow-300 underline font-black' : 'text-white'
            }`}
          >
            My VERLEX
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-friends"
            onClick={() => {
              sounds.playClick();
              onNavigate('friends');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1 ${
              currentPage === 'friends' ? 'text-yellow-300 underline font-black' : 'text-white'
            }`}
          >
            <span>Friends</span>
            {unreadPMs > 0 && (
              <span className="bg-red-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full border border-red-700">
                {unreadPMs}
              </span>
            )}
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-games"
            onClick={() => {
              sounds.playClick();
              onNavigate('games');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer ${
              currentPage === 'games' ? 'text-yellow-300 underline font-black' : 'text-white'
            }`}
          >
            Games
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-studio"
            onClick={() => {
              sounds.playClick();
              onNavigate('studio');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer ${
              currentPage === 'studio' ? 'text-yellow-300 underline font-black' : 'text-white'
            }`}
          >
            Studio
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-catalog"
            onClick={() => {
              sounds.playClick();
              onNavigate('catalog');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer ${
              currentPage === 'catalog' ? 'text-yellow-300 underline font-black' : 'text-white'
            }`}
          >
            Catalog
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-builders-club"
            onClick={() => {
              sounds.playClick();
              onNavigate('builders_club');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer ${
              currentPage === 'builders_club' ? 'text-yellow-300 underline font-black' : 'text-white'
            }`}
          >
            Builders Club
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-forum"
            onClick={() => {
              sounds.playClick();
              onNavigate('forum');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer ${
              currentPage === 'forum' ? 'text-yellow-300 underline font-black' : 'text-white'
            }`}
          >
            Forum
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-filter-trainer"
            onClick={() => {
              sounds.playClick();
              onNavigate('filter_trainer');
            }}
            className={`px-2 py-0.5 hover:underline transition-colors cursor-pointer flex items-center gap-1 ${
              currentPage === 'filter_trainer' ? 'text-yellow-300 underline font-black' : 'text-yellow-400'
            }`}
          >
            ⚡ AI Filter
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-servers"
            onClick={() => {
              sounds.playClick();
              if (onOpenServers) onOpenServers();
              else onNavigate('games');
            }}
            className="px-2 py-0.5 hover:underline text-white cursor-pointer"
          >
            Servers &amp; Codes
          </button>
          <span className="text-blue-200 opacity-60">|</span>

          <button
            id="nav-help"
            onClick={() => {
              sounds.playClick();
              alert('Controls:\n- WASD / Arrow Keys: Move character\n- Space: Jump\n- Right-Click Drag: Rotate Camera\n- 1-8 Keys: Equip Tools\n- Slash (/): Open Chat\n- Shift: Toggle Shift Lock\n\nP2P Multiplayer is enabled for all places. Share your Join Code with friends to play together in real-time!');
            }}
            className="px-2 py-0.5 hover:underline text-white cursor-pointer"
          >
            Help
          </button>
        </div>
      </nav>
    </header>
  );
};
