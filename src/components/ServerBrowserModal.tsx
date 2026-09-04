import React, { useEffect, useState } from 'react';
import { GameServer, MapTemplateId } from '../types';
import { serverRegistry } from '../services/serverRegistry';
import { sounds } from '../game/soundEngine';
import { 
  Server, 
  Plus, 
  Radio, 
  Copy, 
  Check, 
  Users, 
  Activity, 
  Globe, 
  Search, 
  X, 
  Play, 
  ShieldCheck 
} from 'lucide-react';

interface ServerBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinServer: (server: GameServer) => void;
  selectedMapFilter?: MapTemplateId | 'all';
  activeRoomCode?: string;
  activePeerCount?: number;
}

export const ServerBrowserModal: React.FC<ServerBrowserModalProps> = ({
  isOpen,
  onClose,
  onJoinServer,
  selectedMapFilter = 'all',
  activeRoomCode,
  activePeerCount,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'direct' | 'create'>('browse');
  const [mapFilter, setMapFilter] = useState<MapTemplateId | 'all'>(selectedMapFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [servers, setServers] = useState<GameServer[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Direct Join Form
  const [directCode, setDirectCode] = useState<string>('');
  const [directMap, setDirectMap] = useState<MapTemplateId>('crossroads');

  // Create Server Form
  const [createMap, setCreateMap] = useState<MapTemplateId>('crossroads');
  const [createServerName, setCreateServerName] = useState<string>('');
  const [createCustomCode, setCreateCustomCode] = useState<string>('');
  const [createMaxPlayers, setCreateMaxPlayers] = useState<number>(12);

  useEffect(() => {
    if (selectedMapFilter) {
      setMapFilter(selectedMapFilter);
    }
  }, [selectedMapFilter]);

  useEffect(() => {
    const unsub = serverRegistry.subscribe((updated) => {
      setServers(updated);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const filteredServers = servers.filter((s) => {
    const matchesMap = mapFilter === 'all' || s.mapId === mapFilter;
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMap && matchesSearch;
  });

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    sounds.playClick();
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDirectJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directCode.trim()) return;

    sounds.playClick();
    const clean = directCode.trim().toUpperCase();
    const found = serverRegistry.findServerByCode(clean);

    if (found) {
      onJoinServer(found);
    } else {
      // Guess map from prefix if possible
      let guessedMap: MapTemplateId = directMap;
      if (clean.startsWith('CR-')) guessedMap = 'crossroads';
      else if (clean.startsWith('CC-')) guessedMap = 'physics_lab';
      else if (clean.startsWith('HH-')) guessedMap = 'happy_home';
      else if (clean.startsWith('BP-')) guessedMap = 'baseplate';
      else if (clean.startsWith('OB-')) guessedMap = 'obby';

      const syntheticServer: GameServer = {
        id: `srv_direct_${Date.now()}`,
        roomCode: clean,
        mapId: guessedMap,
        name: `Custom Room [${clean}]`,
        hostName: 'Peer_Host',
        playerCount: 1,
        maxPlayers: 12,
        region: 'Direct P2P',
        ping: 25,
        createdAt: Date.now(),
      };
      onJoinServer(syntheticServer);
    }
    onClose();
  };

  const handleCreateServerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    const playerName = localStorage.getItem('verlex_player_name') || 'Verlexian';
    const newServer = serverRegistry.createCustomServer(
      createMap,
      createServerName,
      createCustomCode || undefined,
      playerName,
      createMaxPlayers
    );
    onJoinServer(newServer);
    onClose();
  };

  const mapNames: Record<MapTemplateId, string> = {
    crossroads: 'Crossroads ',
    physics_lab: 'Chaos Canyon',
    happy_home: 'Happy Home',
    baseplate: 'Baseplate Builder',
    obby: 'Verlex Obby IV',
    studio_map: 'Creative Studio',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 font-sans select-none animate-in fade-in duration-150">
      <div 
        id="server-browser-modal"
        className="w-full max-w-3xl bg-[#f0f0f0] border-2 border-[#5c87de] rounded-xs shadow-[0_10px_30pxverlex_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-gray-800"
      >
        {/* Title Bar (Windows XP /  Header) */}
        <div className="bg-gradient-to-r from-[#215cd4] via-[#3b7ee0] to-[#5594ec] px-3 py-2 text-white font-bold text-sm flex items-center justify-between border-b border-[#1b439c] shadow-xs">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-yellow-300" />
            <span className="tracking-wide drop-shadow-xs">VERLEX Multiplayer Server Browser &ndash; Join Codes</span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-5 h-5 bg-[#c73838] hover:bg-[#e04545] border border-white/60 rounded-xs flex items-center justify-center text-white text-xs font-black shadow-inner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#e4e4e4] border-b border-gray-400 px-3 pt-2 flex items-center space-x-1 text-xs font-bold">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('browse');
            }}
            className={`px-4 py-1.5 border border-b-0 rounded-t-xs transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'browse'
                ? 'bg-white text-[#003399] border-gray-400 shadow-xs'
                : 'bg-[#d8d8d8] hover:bg-[#ececec] text-gray-700 border-gray-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Servers ({servers.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('direct');
            }}
            className={`px-4 py-1.5 border border-b-0 rounded-t-xs transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'direct'
                ? 'bg-white text-[#003399] border-gray-400 shadow-xs'
                : 'bg-[#d8d8d8] hover:bg-[#ececec] text-gray-700 border-gray-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>Direct Join Code</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('create');
            }}
            className={`px-4 py-1.5 border border-b-0 rounded-t-xs transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'create'
                ? 'bg-white text-[#003399] border-gray-400 shadow-xs'
                : 'bg-[#d8d8d8] hover:bg-[#ececec] text-gray-700 border-gray-400'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Host New Server</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-4 max-h-[68vh] overflow-y-auto bg-white">
          
          {/* TAB 1: BROWSE SERVERS */}
          {activeTab === 'browse' && (
            <div className="space-y-3">
              {/* Filters & Search */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f8f9fb] p-2.5 border border-gray-300 rounded-xs text-xs">
                <div className="flex items-center space-x-1.5 overflow-x-auto">
                  <span className="font-bold text-gray-600 mr-1">Place:</span>
                  {(['all', 'crossroads', 'physics_lab', 'happy_home', 'baseplate', 'obby'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        sounds.playClick();
                        setMapFilter(m);
                      }}
                      className={`px-2 py-0.5 rounded-xs border text-[11px] font-bold ${
                        mapFilter === m
                          ? 'bg-[#5c87de] text-white border-[#1e3d7a]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {m === 'all' ? 'All Places' : mapNames[m]}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or code..."
                    className="pl-6 pr-2 py-1 bg-white border border-gray-300 text-xs text-black w-48 rounded-xs focus:outline-none focus:border-blue-600"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-1.5 top-1.5" />
                </div>
              </div>

              {/* Server List Table */}
              <div className="border border-gray-300 rounded-xs overflow-hidden">
                <div className="grid grid-cols-12 bg-[#e9ecf2] px-3 py-1.5 text-[11px] font-black text-gray-700 border-b border-gray-300 uppercase tracking-wider">
                  <div className="col-span-4 sm:col-span-5">Server Name &amp; Place</div>
                  <div className="col-span-3 sm:col-span-3">Join Code</div>
                  <div className="col-span-2 sm:col-span-2 text-center">Players</div>
                  <div className="col-span-3 sm:col-span-2 text-right">Action</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {filteredServers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs">
                      No active servers found matching your criteria.
                    </div>
                  ) : (
                    filteredServers.map((srv) => {
                      const isCurrent = activeRoomCode === srv.roomCode;
                      return (
                        <div
                          key={srv.id}
                          className={`grid grid-cols-12 px-3 py-2.5 items-center hover:bg-blue-50/70 transition-colors text-xs ${
                            isCurrent ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                          }`}
                        >
                          {/* Name & Map */}
                          <div className="col-span-4 sm:col-span-5 pr-2">
                            <div className="font-bold text-[#003399] flex items-center space-x-1.5">
                              <span>{srv.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-xs">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center space-x-2 mt-0.5">
                              <span>📍 {mapNames[srv.mapId]}</span>
                              <span>•</span>
                              <span>Host: <strong className="text-gray-700">{srv.hostName}</strong></span>
                            </div>
                          </div>

                          {/* Join Code with 1-click Copy */}
                          <div className="col-span-3 sm:col-span-3">
                            <button
                              onClick={(e) => handleCopyCode(srv.roomCode, e)}
                              className="group flex items-center space-x-1.5 bg-[#f0f4f8] hover:bg-[#e2eaf4] border border-blue-300 px-2 py-1 rounded-xs font-mono font-bold text-[#1a237e] text-xs transition"
                              title="Click to copy join code"
                            >
                              <span>{srv.roomCode}</span>
                              {copiedCode === srv.roomCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-blue-400 group-hover:text-blue-600" />
                              )}
                            </button>
                          </div>

                          {/* Players & Ping */}
                          <div className="col-span-2 sm:col-span-2 text-center">
                            <div className="flex items-center justify-center space-x-1 font-bold text-gray-700">
                              <Users className="w-3 h-3 text-emerald-600" />
                              <span>
                                {activeRoomCode === srv.roomCode && activePeerCount !== undefined
                                  ? activePeerCount + 1
                                  : srv.playerCount}
                                /{srv.maxPlayers}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center space-x-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{srv.ping}ms</span>
                            </div>
                          </div>

                          {/* Join Action Button */}
                          <div className="col-span-3 sm:col-span-2 text-right">
                            <button
                              onClick={() => {
                                sounds.playClick();
                                onJoinServer(srv);
                                onClose();
                              }}
                              className="w-full sm:w-auto px-3 py-1 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] hover:brightness-105 border border-[#b87d00] text-black font-black text-xs rounded-xs shadow-xs active:translate-y-0.5"
                            >
                              ▶ Join
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT JOIN CODE */}
          {activeTab === 'direct' && (
            <div className="max-w-md mx-auto py-4 space-y-4">
              <div className="bg-[#f2f6fc] border border-blue-300 p-3.5 rounded-xs text-xs text-gray-700 space-y-2">
                <div className="font-bold text-[#1e3d7a] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Enter a Friend&apos;s Server Join Code</span>
                </div>
                <p>
                  Paste or type the exact Join Code shared by your friend (e.g. <code>CR-777</code>, <code>CC-4012</code>, <code>HH-1024</code>, or custom room code) to immediately link into their P2P physics arena!
                </p>
              </div>

              <form onSubmit={handleDirectJoinSubmit} className="space-y-3 bg-white p-4 border border-gray-300 rounded-xs shadow-xs">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Server Join Code:
                  </label>
                  <input
                    type="text"
                    value={directCode}
                    onChange={(e) => setDirectCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CR-777"
                    className="w-full px-3 py-2 bg-white border-2 border-blue-400 font-mono font-bold text-base text-black rounded-xs focus:outline-none focus:border-blue-600 uppercase tracking-wider"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Place (Fallback):
                  </label>
                  <select
                    value={directMap}
                    onChange={(e) => setDirectMap(e.target.value as MapTemplateId)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 text-xs font-medium text-black rounded-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="crossroads">Crossroads ()</option>
                    <option value="physics_lab">Chaos Canyon</option>
                    <option value="happy_home">Happy Home in Verlexia</option>
                    <option value="baseplate">Baseplate Builder Sandbox</option>
                    <option value="obby">Verlex Obstacle Course IV</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] hover:brightness-105 border-2 border-[#b87d00] text-black font-black text-sm py-2 rounded-xs shadow-md active:translate-y-0.5 cursor-pointer"
                >
                  🚀 Connect &amp; Launch 3D World
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: HOST NEW SERVER */}
          {activeTab === 'create' && (
            <div className="max-w-md mx-auto py-2 space-y-4">
              <div className="bg-[#f9fafc] border border-gray-300 p-3 rounded-xs text-xs text-gray-600">
                <span className="font-bold text-[#1e3d7a]">Create Your Own Dedicated Server:</span> You will become the server host, creating a unique join code that all other players can use to join your 3D session.
              </div>

              <form onSubmit={handleCreateServerSubmit} className="space-y-3 bg-white p-4 border border-gray-300 rounded-xs shadow-xs">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Select Place / Map:
                  </label>
                  <select
                    value={createMap}
                    onChange={(e) => setCreateMap(e.target.value as MapTemplateId)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 text-xs font-bold text-black rounded-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="crossroads">Crossroads ( BrickBattle)</option>
                    <option value="physics_lab">Chaos Canyon (Warzone)</option>
                    <option value="happy_home">Happy Home in Verlexia</option>
                    <option value="baseplate">Baseplate Builder Sandbox</option>
                    <option value="obby">Verlex Obstacle Course IV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Server Name:
                  </label>
                  <input
                    type="text"
                    value={createServerName}
                    onChange={(e) => setCreateServerName(e.target.value)}
                    placeholder="e.g. Sword Battle Arena #1"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 text-xs text-black rounded-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Custom Join Code (Optional):
                    </label>
                    <input
                      type="text"
                      value={createCustomCode}
                      onChange={(e) => setCreateCustomCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CR-7779999"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 font-mono text-xs font-bold text-black rounded-xs focus:outline-none focus:border-blue-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Max Players:
                    </label>
                    <select
                      value={createMaxPlayers}
                      onChange={(e) => setCreateMaxPlayers(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 text-xs font-bold text-black rounded-xs focus:outline-none focus:border-blue-600"
                    >
                      <option value={6}>6 Players</option>
                      <option value={8}>8 Players</option>
                      <option value={12}>12 Players</option>
                      <option value={16}>16 Players</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] hover:brightness-105 border-2 border-[#b87d00] text-black font-black text-sm py-2 rounded-xs shadow-md active:translate-y-0.5 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Host &amp; Enter Server</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="bg-[#f2f2f2] px-4 py-2 border-t border-gray-300 text-[11px] text-gray-600 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>P2P Multiplayer is always enabled &ndash; Share your Join Code with friends!</span>
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 text-gray-800 text-xs font-bold rounded-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
