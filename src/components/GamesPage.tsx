import React, { useState, useEffect } from 'react';
import { GameServer, MapTemplateId, RemixedPlace } from '../types';
import { serverRegistry } from '../services/serverRegistry';
import { remixService } from '../services/remixService';
import { sounds } from '../game/soundEngine';
import { Radio, Server, Users, ArrowRight, ShoppingBag, GitFork, Sparkles, Code2, Trash2, Play } from 'lucide-react';
import { GamePassesModal } from './GamePassesModal';

interface GamesPageProps {
  onLaunchGame: (mapId: MapTemplateId) => void;
  onJoinServer: (server: GameServer) => void;
  onOpenServerBrowser: (mapId?: MapTemplateId) => void;
  onRemixToStudio?: (remixedPlace: RemixedPlace) => void;
  onPlayRemixGame?: (remixedPlace: RemixedPlace) => void;
  playerName?: string;
}

interface GameItem {
  id: MapTemplateId;
  title: string;
  creator: string;
  defaultCode: string;
  players: number;
  visits: number;
  category: 'Popular' | 'BrickBattle' | 'Building' | 'Featured' | 'Obby';
  description: string;
  icon: string;
  gradient: string;
}

export const GamesPage: React.FC<GamesPageProps> = ({ 
  onLaunchGame, 
  onJoinServer,
  onOpenServerBrowser,
  onRemixToStudio,
  onPlayRemixGame,
  playerName = 'Verlexian'
}) => {
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [directCodeInput, setDirectCodeInput] = useState<string>('');
  const [selectedStoreGame, setSelectedStoreGame] = useState<{ id: string; title: string } | null>(null);
  const [remixedPlaces, setRemixedPlaces] = useState<RemixedPlace[]>(remixService.getRemixedPlaces());

  useEffect(() => {
    const unsub = remixService.subscribe(() => {
      setRemixedPlaces(remixService.getRemixedPlaces());
    });
    return unsub;
  }, []);

  const handleRemix = (gameId: MapTemplateId, title: string, creator: string) => {
    sounds.playClick();
    const newRemix = remixService.remixGame(gameId, title, creator, playerName);
    if (onRemixToStudio) {
      onRemixToStudio(newRemix);
    }
  };

  const games: GameItem[] = [
    {
      id: 'crossroads',
      title: 'Crossroads',
      creator: 'Verlex',
      defaultCode: 'CR-777',
      players: 0,
      visits: 89040,
      category: 'BrickBattle',
      description: 'The legendary brick battle arena with towers, bridges, sword duels, and rocket launchers.',
      icon: '🏰',
      gradient: 'from-[#4a6b82] via-[#2c3e50] to-[#1a252f]',
    },
    {
      id: 'physics_lab',
      title: 'Chaos Canyon',
      creator: 'Telamon',
      defaultCode: 'CC-4012',
      players: 0,
      visits: 54120,
      category: 'BrickBattle',
      description: 'Canyon warzone with suspended bridges, destructible towers, and bounce pads.',
      icon: '🏜️',
      gradient: 'from-[#d35400] via-[#e67e22] to-[#f39c12]',
    },
    {
      id: 'happy_home',
      title: 'Happy Home in Verlexia',
      creator: 'Shedletsky',
      defaultCode: 'HH-1024',
      players: 0,
      visits: 120500,
      category: 'Building',
      description: 'The iconic yellow brick starter home on lush green studs. Build, modify, or explore!',
      icon: '🏡',
      gradient: 'from-[#27ae60] via-[#2ecc71] to-[#3498db]',
    },
    {
      id: 'baseplate',
      title: 'Baseplate Builder Sandbox',
      creator: 'Builderman',
      defaultCode: 'BP-1337',
      players: 0,
      visits: 97000,
      category: 'Building',
      description: 'A colossal green stud building arena with Newtonian physics, conveyor belts, and TNT.',
      icon: '🧱',
      gradient: 'from-[#7f8c8d] via-[#95a5a6] to-[#bdc3c7]',
    },
    {
      id: 'obby',
      title: 'Verlex Obstacle Course IV',
      creator: 'Clockwork',
      defaultCode: 'OB-7788',
      players: 0,
      visits: 63200,
      category: 'Obby',
      description: 'Challenging obby with lava bricks, moving conveyor platforms, and super trampolines.',
      icon: '🏃',
      gradient: 'from-[#8e44ad] via-[#9b59b6] to-[#2c3e50]',
    },
  ];

  const filteredGames = games.filter((g) => {
    const matchesFilter = filter === 'All' || g.category === filter;
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDirectJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directCodeInput.trim()) return;

    sounds.playClick();
    const clean = directCodeInput.trim().toUpperCase();
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

  return (
    <div id="verlex-games-page" className="w-full bg-[#efefef] min-h-[calc(100vh-140px)] py-4 px-2 sm:px-6 select-none font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Header & Direct Join Bar */}
        <div className="bg-white border border-gray-400 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1e3d7a] flex items-center space-x-2">
              <Server className="w-6 h-6 text-[#1e3d7a]" />
              <span>VERLEX Multiplayer Playworld &ndash; Server Directory</span>
            </h1>
            <p className="text-xs text-gray-600">
              Join active P2P servers with Join Codes or host your own multiplayer sandbox arena.
            </p>
          </div>

          {/* Quick Direct Join & Server Browser Button */}
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleDirectJoinSubmit} className="flex items-center space-x-1.5">
              <input
                type="text"
                value={directCodeInput}
                onChange={(e) => setDirectCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter Join Code (e.g. CR-777)"
                className="px-2.5 py-1 bg-white border border-blue-400 font-mono font-bold text-xs text-black focus:outline-none focus:border-blue-600 uppercase"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] hover:brightness-105 border border-[#b87d00] text-black font-black text-xs rounded-xs cursor-pointer shadow-xs active:translate-y-0.5"
              >
                Join Code
              </button>
            </form>

            <button
              onClick={() => {
                sounds.playClick();
                onOpenServerBrowser('all');
              }}
              className="px-3 py-1 bg-[#5c87de] hover:bg-[#4a73c5] text-white font-bold text-xs border border-[#1e3d7a] flex items-center space-x-1 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Browse All Servers</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-400 pb-1 text-xs font-bold">
          <div className="flex items-center space-x-1">
            {['All', 'Popular', 'BrickBattle', 'Building', 'Obby', 'My Remixed Games'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  sounds.playClick();
                  setFilter(cat);
                }}
                className={`px-3 py-1 border border-b-0 cursor-pointer flex items-center space-x-1 ${
                  filter === cat ? 'bg-[#5c87de] text-white border-[#1e3d7a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400'
                }`}
              >
                {cat === 'My Remixed Games' && <GitFork className="w-3.5 h-3.5 text-amber-500" />}
                <span>{cat === 'My Remixed Games' ? `My Remixed Places (${remixedPlaces.length})` : `${cat} Places`}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Places..."
              className="px-2 py-1 bg-white border border-gray-400 font-sans text-xs text-black focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Remixed Places View when 'My Remixed Games' tab is active */}
        {filter === 'My Remixed Games' ? (
          <div>
            {remixedPlaces.length === 0 ? (
              <div className="bg-white border border-gray-400 p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center mx-auto text-amber-700">
                  <GitFork className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-800 text-base">You haven't remixed any places yet!</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  Click the <strong>"🔀 Remix Game"</strong> button on any Verlex place card below to clone it directly into Verlex Studio, edit parts &amp; scripts, and create your own version!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {remixedPlaces.map((place) => (
                  <div key={place.id} className="bg-white border-2 border-indigo-300 p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="h-28 w-full bg-gradient-to-br from-indigo-900 via-slate-800 to-indigo-950 border border-indigo-400 flex flex-col items-center justify-center relative p-3 text-center">
                        <span className="text-3xl">🔀</span>
                        <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-xs mt-2 uppercase tracking-wider">
                          REMIXED PLACE
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <h3 className="font-extrabold text-sm text-[#003399] line-clamp-1">{place.title}</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Remixed from <strong className="text-indigo-700">{place.remixInfo.originalTitle}</strong> by {place.remixInfo.originalCreator}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Contains {place.parts.length} parts &bull; Verlex Studio Ready
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-gray-200 flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          if (onPlayRemixGame) onPlayRemixGame(place);
                          else onLaunchGame('studio_map');
                        }}
                        className="flex-1 bg-gradient-to-b from-[#2ecc71] to-[#27ae60] hover:brightness-105 border border-[#1b8a47] text-white font-extrabold text-xs py-1.5 rounded-xs shadow-xs cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Play Now</span>
                      </button>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          if (onRemixToStudio) onRemixToStudio(place);
                        }}
                        className="flex-1 bg-gradient-to-b from-[#5c87de] to-[#3a65bc] hover:brightness-105 border border-[#1e3d7a] text-white font-extrabold text-xs py-1.5 rounded-xs shadow-xs cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Edit in Studio</span>
                      </button>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          remixService.deletePlace(place.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded border border-gray-300 cursor-pointer shrink-0"
                        title="Delete Remix"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Places Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredGames.map((game) => {
              const serverCount = serverRegistry.getServersForMap(game.id).length;

              return (
                <div
                  key={game.id}
                  className="bg-white border border-gray-400 p-3 shadow-xs hover:shadow-md hover:border-blue-600 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Visual Thumbnail */}
                    <div 
                      onClick={() => {
                        sounds.playClick();
                        onLaunchGame(game.id);
                      }}
                      className={`h-36 w-full bg-gradient-to-br ${game.gradient} border border-gray-500 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-[1.01] transition-transform cursor-pointer`}
                    >
                      <span className="text-5xl drop-shadow-md">{game.icon}</span>
                      <div className="absolute top-2 right-2 bg-black/75 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-xs flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{serverCount} Active Servers</span>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <h3 
                        onClick={() => {
                          sounds.playClick();
                          onLaunchGame(game.id);
                        }}
                        className="font-bold text-sm text-[#003399] group-hover:underline line-clamp-1 cursor-pointer"
                      >
                        {game.title}
                      </h3>
                      <div className="text-[11px] text-gray-500 flex items-center justify-between mt-0.5">
                        <span>Creator: <strong className="text-gray-700">{game.creator}</strong></span>
                        <span>Default Code: <strong className="font-mono text-blue-700">{game.defaultCode}</strong></span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Quick Play, Servers, Remix, and Game Store / Passes */}
                  <div className="mt-4 pt-2 border-t border-gray-200 flex flex-col gap-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onLaunchGame(game.id);
                        }}
                        className="w-full bg-gradient-to-b from-[#ffd84d] via-[#f7c229] to-[#df9e0c] hover:brightness-105 border border-[#b87d00] text-black font-black text-xs py-1.5 rounded-xs shadow-xs active:translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <span>▶ Play Now</span>
                      </button>

                      <button
                        onClick={() => handleRemix(game.id, game.title, game.creator)}
                        className="w-full bg-gradient-to-b from-indigo-600 to-indigo-800 hover:brightness-110 border border-indigo-900 text-white font-black text-xs py-1.5 rounded-xs shadow-xs active:translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1"
                        title="Clone & edit this place in Verlex Studio!"
                      >
                        <GitFork className="w-3.5 h-3.5 text-amber-300" />
                        <span>Remix Game</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onOpenServerBrowser(game.id);
                        }}
                        className="w-full bg-[#eef3fb] hover:bg-[#dfeaf8] border border-[#a4c2f4] text-[#003399] font-bold text-xs py-1 rounded-xs shadow-2xs cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Server className="w-3 h-3 text-blue-600" />
                        <span>Servers ({serverCount})</span>
                      </button>

                      <button
                        onClick={() => {
                          sounds.playClick();
                          setSelectedStoreGame({ id: game.id, title: game.title });
                        }}
                        className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-400 text-emerald-800 font-bold text-xs py-1 rounded-xs shadow-2xs cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Passes &amp; Store</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Game Passes Store Modal */}
        {selectedStoreGame && (
          <GamePassesModal
            isOpen={true}
            onClose={() => setSelectedStoreGame(null)}
            gameId={selectedStoreGame.id}
            gameTitle={selectedStoreGame.title}
            playerName={playerName}
          />
        )}

      </div>
    </div>
  );
};
