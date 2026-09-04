import React, { useState, useEffect } from 'react';
import { 
  Friend, 
  PrivateMessage, 
  PrivateP2PGame, 
  PendingFriendRequest,
  friendsService 
} from '../services/friendsService';
import { playerRegistryService, RegisteredPlayer } from '../services/playerRegistryService';
import { MapTemplateId } from '../types';
import { sounds } from '../game/soundEngine';
import { 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  Gamepad2, 
  UserPlus, 
  Copy, 
  Check, 
  Radio, 
  ShieldAlert, 
  Send, 
  Trash2, 
  Sparkles, 
  Key, 
  Lock, 
  Unlock, 
  Circle, 
  Activity, 
  Search,
  ExternalLink,
  Shield,
  Clock,
  UserCheck,
  UserX,
  Database,
  User
} from 'lucide-react';

interface FriendsPageProps {
  onPlayGame?: (mapId: MapTemplateId, roomCode?: string) => void;
  onNavigate?: (page: any) => void;
  currentName?: string;
  onSwitchAccount?: (name: string) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({
  onPlayGame,
  onNavigate,
  currentName = 'Guest',
  onSwitchAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'messages' | 'trusted' | 'private_games' | 'activity' | 'players_database'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>(() => playerRegistryService.getAllPlayersNewestToOldest());
  const [myTrustedCode, setMyTrustedCode] = useState<string>('');
  const [myStatus, setMyStatus] = useState<'online' | 'in_game' | 'busy' | 'offline'>('online');
  const [myCustomStatus, setMyCustomStatus] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'trusted'>('all');

  // Add Friend Form
  const [addFriendName, setAddFriendName] = useState<string>('');
  const [addFriendFeedback, setAddFriendFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redeem Trusted Code Form
  const [redeemCodeInput, setRedeemCodeInput] = useState<string>('');
  const [redeemFeedback, setRedeemFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Unfriend Confirmation Modal State
  const [unfriendTarget, setUnfriendTarget] = useState<{ id: string; name: string } | null>(null);

  // Private Messages State
  const [selectedFriendForChat, setSelectedFriendForChat] = useState<Friend | null>(null);
  const [chatMessages, setChatMessages] = useState<PrivateMessage[]>([]);
  const [inputMessageText, setInputMessageText] = useState<string>('');

  // Private Games State
  const [privateGames, setPrivateGames] = useState<PrivateP2PGame[]>([]);
  const [createGameMap, setCreateGameMap] = useState<MapTemplateId>('crossroads');
  const [createGameName, setCreateGameName] = useState<string>('');
  const [createGameAccess, setCreateGameAccess] = useState<'friends_only' | 'trusted_only' | 'code_required'>('friends_only');
  const [createGamePasscode, setCreateGamePasscode] = useState<string>('');

  // Friend Requests State
  const [incomingRequests, setIncomingRequests] = useState<PendingFriendRequest[]>(friendsService.getIncomingRequests());
  const [outgoingRequests, setOutgoingRequests] = useState<PendingFriendRequest[]>(friendsService.getOutgoingRequests());

  // Activities
  const [activities, setActivities] = useState(friendsService.getActivities());

  useEffect(() => {
    const update = () => {
      const allFriends = friendsService.getFriends();
      setFriends([...allFriends]);
      setIncomingRequests([...friendsService.getIncomingRequests()]);
      setOutgoingRequests([...friendsService.getOutgoingRequests()]);
      setMyTrustedCode(friendsService.getMyTrustedCode());
      const st = friendsService.getMyStatus();
      setMyStatus(st.status);
      setMyCustomStatus(st.customStatus);
      setPrivateGames([...friendsService.getPrivateGames()]);
      setActivities([...friendsService.getActivities()]);

      if (selectedFriendForChat) {
        setChatMessages(friendsService.getMessagesWith(selectedFriendForChat.id));
      }
    };

    update();
    const unsub = friendsService.subscribe(update);
    const unsubReg = playerRegistryService.subscribe(() => {
      setRegisteredPlayers(playerRegistryService.getAllPlayersNewestToOldest());
    });
    return () => {
      unsub();
      unsubReg();
    };
  }, [selectedFriendForChat]);

  // Handle friend selection for chat
  const handleSelectFriendChat = (friend: Friend) => {
    sounds.playClick();
    setSelectedFriendForChat(friend);
    setActiveTab('messages');
    setChatMessages(friendsService.getMessagesWith(friend.id));
    friendsService.markMessagesRead(friend.id);
  };

  // Handle Add Friend submit (Sends Friend Request)
  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendName.trim()) return;
    sounds.playClick();
    const res = friendsService.sendFriendRequest(addFriendName.trim());
    if (res.success) {
      setAddFriendFeedback({ type: 'success', text: res.message });
      setAddFriendName('');
    } else {
      setAddFriendFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setAddFriendFeedback(null), 5000);
  };

  // Handle Redeem Trusted Code submit
  const handleRedeemCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCodeInput.trim()) return;
    sounds.playClick();
    const res = friendsService.addFriendByTrustedCode(redeemCodeInput.trim());
    if (res.success) {
      setRedeemFeedback({ type: 'success', text: res.message });
      setRedeemCodeInput('');
    } else {
      setRedeemFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setRedeemFeedback(null), 4000);
  };

  // Handle Send PM
  const handleSendPM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendForChat || !inputMessageText.trim()) return;
    sounds.playClick();
    friendsService.sendPrivateMessage(selectedFriendForChat.id, inputMessageText.trim());
    setInputMessageText('');
    setChatMessages(friendsService.getMessagesWith(selectedFriendForChat.id));
  };

  // Copy trusted code
  const handleCopyTrustedCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(myTrustedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Toggle Trusted Status
  const handleToggleTrusted = (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    friendsService.toggleTrustedFriend(friendId);
  };

  // Create Private P2P Game
  const handleCreatePrivateGame = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    const name = createGameName.trim() || `My Private ${createGameMap.toUpperCase()} Server`;
    const newGame = friendsService.createPrivateP2PGame(
      createGameMap,
      name,
      createGameAccess,
      createGamePasscode || undefined
    );
    setCreateGameName('');
    setCreateGamePasscode('');
    
    if (onPlayGame) {
      onPlayGame(newGame.mapId, newGame.roomCode);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (f.customStatus && f.customStatus.toLowerCase().includes(searchFilter.toLowerCase()));
    if (statusFilter === 'online') return matchesSearch && f.status !== 'offline';
    if (statusFilter === 'trusted') return matchesSearch && f.isTrusted;
    return matchesSearch;
  });

  const unreadCount = friendsService.getUnreadCount();

  const mapDisplayNames: Record<MapTemplateId, string> = {
    crossroads: 'Crossroads ',
    physics_lab: 'Chaos Canyon',
    happy_home: 'Happy Home',
    baseplate: 'Baseplate Builder',
    obby: 'Verlex Obby IV',
    studio_map: 'Creative Studio',
  };

  return (
    <div id="friends-page-root" className="w-full bg-[#f3f4f6] min-h-[calc(100vh-140px)] py-6 px-4 md:px-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Banner */}
        <div className="bg-white border-2 border-[#5c87de] rounded-xs shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="bg-gradient-to-r from-[#215cd4] via-[#3b7ee0] to-[#5594ec] p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1b439c]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xs bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-yellow-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wide drop-shadow-xs flex items-center gap-2">
                  VERLEX Social &amp; Friends
                  <span className="text-xs bg-yellow-400 text-gray-900 font-bold px-2 py-0.5 rounded-full border border-yellow-500 shadow-xs">
                    P2P Network
                  </span>
                </h1>
                <p className="text-xs text-blue-100 font-medium">
                  Connect with friends, private message with filter bypass, share trusted codes, and host private games!
                </p>
              </div>
            </div>

            {/* User Presence Pill */}
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-sm border border-white/20 text-xs">
              <span className="font-bold text-blue-100">Status:</span>
              <select
                value={myStatus}
                onChange={(e) => friendsService.updateMyStatus(e.target.value as any)}
                className="bg-[#1b439c] text-white font-bold px-2 py-0.5 rounded-xs border border-blue-300 focus:outline-none cursor-pointer"
              >
                <option value="online">🟢 Online</option>
                <option value="in_game">🎮 In Game</option>
                <option value="busy">⛔ Do Not Disturb</option>
                <option value="offline">⚪ Invisible</option>
              </select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-[#e9ecef] border-b border-gray-300 flex items-center overflow-x-auto text-xs sm:text-sm font-bold scrollbar-thin">
            <button
              onClick={() => { sounds.playClick(); setActiveTab('friends'); }}
              className={`px-4 py-2.5 flex items-center space-x-2 border-r border-gray-300 transition-colors cursor-pointer ${
                activeTab === 'friends' ? 'bg-white text-[#215cd4] border-b-2 border-b-[#215cd4]' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 text-[#215cd4]" />
              <span>Friends ({friends.length})</span>
              {incomingRequests.length > 0 && (
                <span className="bg-amber-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full border border-amber-700 animate-pulse">
                  {incomingRequests.length} req
                </span>
              )}
            </button>

            <button
              onClick={() => { 
                sounds.playClick(); 
                setActiveTab('messages'); 
                if (!selectedFriendForChat && friends.length > 0) {
                  setSelectedFriendForChat(friends[0]);
                }
              }}
              className={`px-4 py-2.5 flex items-center space-x-2 border-r border-gray-300 transition-colors cursor-pointer relative ${
                activeTab === 'messages' ? 'bg-white text-[#215cd4] border-b-2 border-b-[#215cd4]' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#215cd4]" />
              <span>Private Messages</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full border border-red-700 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('trusted'); }}
              className={`px-4 py-2.5 flex items-center space-x-2 border-r border-gray-300 transition-colors cursor-pointer ${
                activeTab === 'trusted' ? 'bg-white text-emerald-700 border-b-2 border-b-emerald-600' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Trusted Friends &amp; Code</span>
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('private_games'); }}
              className={`px-4 py-2.5 flex items-center space-x-2 border-r border-gray-300 transition-colors cursor-pointer ${
                activeTab === 'private_games' ? 'bg-white text-purple-700 border-b-2 border-b-purple-600' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-purple-600" />
              <span>Private P2P Games ({privateGames.length})</span>
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('players_database'); }}
              className={`px-4 py-2.5 flex items-center space-x-2 border-r border-gray-300 transition-colors cursor-pointer ${
                activeTab === 'players_database' ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>P2P Player Database ({registeredPlayers.length})</span>
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('activity'); }}
              className={`px-4 py-2.5 flex items-center space-x-2 transition-colors cursor-pointer ${
                activeTab === 'activity' ? 'bg-white text-amber-700 border-b-2 border-b-amber-600' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Social Activity</span>
            </button>
          </div>
        </div>

        {/* --- TAB 1: FRIENDS LIST --- */}
        {activeTab === 'friends' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Friends List */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Search & Filter Toolbar */}
              <div className="bg-white p-3 rounded-xs border border-gray-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xs focus:bg-white focus:outline-none focus:border-[#215cd4]"
                  />
                </div>

                <div className="flex items-center space-x-1 text-xs font-bold w-full sm:w-auto justify-end">
                  <span className="text-gray-500 mr-1">Filter:</span>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-xs border cursor-pointer ${
                      statusFilter === 'all' ? 'bg-[#215cd4] text-white border-[#1b439c]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({friends.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('online')}
                    className={`px-2.5 py-1 rounded-xs border cursor-pointer ${
                      statusFilter === 'online' ? 'bg-emerald-600 text-white border-emerald-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Online ({friends.filter(f => f.status !== 'offline').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('trusted')}
                    className={`px-2.5 py-1 rounded-xs border cursor-pointer ${
                      statusFilter === 'trusted' ? 'bg-yellow-500 text-gray-900 font-black border-yellow-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🛡️ Trusted ({friends.filter(f => f.isTrusted).length})
                  </button>
                </div>
              </div>

              {/* Pending Friend Requests Section */}
              {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
                <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xs p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                      <h3 className="font-black text-sm text-amber-900">
                        Pending Friend Requests ({incomingRequests.length + outgoingRequests.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded border border-amber-300">
                      P2P Device Verification
                    </span>
                  </div>

                  {/* Incoming Requests */}
                  {incomingRequests.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        <span>Incoming Requests ({incomingRequests.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {incomingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="bg-white border border-amber-300 rounded-xs p-3 flex items-center justify-between shadow-xs gap-2"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center border border-amber-300 shrink-0">
                                <UserPlus className="w-4 h-4 text-amber-700" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-black text-xs text-gray-900 truncate">{req.fromUsername}</span>
                                  {req.isTrusted && (
                                    <span className="bg-amber-100 text-amber-900 font-bold text-[9px] px-1 py-0.2 rounded border border-amber-300 flex items-center gap-0.5 shrink-0">
                                      <ShieldCheck className="w-2.5 h-2.5 text-amber-600" />
                                      Trusted
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium block">P2P friend request</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => {
                                  sounds.playClick();
                                  const res = friendsService.acceptFriendRequest(req.id);
                                  if (res.success) {
                                    setAddFriendFeedback({ type: 'success', text: res.message });
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center space-x-1 shadow-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() => {
                                  sounds.playClick();
                                  const res = friendsService.declineFriendRequest(req.id);
                                  if (res.success) {
                                    setAddFriendFeedback({ type: 'error', text: res.message });
                                  }
                                }}
                                className="bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700 font-bold text-xs px-2 py-1 rounded-xs transition cursor-pointer"
                                title="Decline request"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outgoing Requests */}
                  {outgoingRequests.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">
                        Sent Requests ({outgoingRequests.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {outgoingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="bg-white/90 border border-gray-300 rounded-xs p-2.5 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-gray-800 truncate block">{req.toUsername}</span>
                                <span className="text-[10px] text-gray-500 block">Waiting for user acceptance...</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                sounds.playClick();
                                friendsService.cancelOutgoingRequest(req.id);
                              }}
                              className="text-[11px] font-bold text-gray-500 hover:text-red-600 hover:underline cursor-pointer shrink-0 ml-2"
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Friends Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFriends.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-xs border border-dashed border-gray-300 text-center space-y-3">
                    <Users className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-gray-500 font-bold text-sm">No friends match your filter criteria.</p>
                    <p className="text-xs text-gray-400">Add friends using their username or exchange Trusted Codes!</p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className={`bg-white rounded-xs border-2 transition-all shadow-xs hover:shadow-md p-4 flex flex-col justify-between space-y-3 relative ${
                        friend.isTrusted ? 'border-amber-400' : 'border-gray-200'
                      }`}
                    >
                      {/* Top Row: Avatar & Details */}
                      <div className="flex items-start space-x-3">
                        {/* 2D Avatar Stylized Box */}
                        <div className="w-14 h-14 rounded-xs border border-gray-300 flex items-center justify-center p-1 relative overflow-hidden" style={{ backgroundColor: friend.avatar.torsoColor || '#3b82f6' }}>
                          <div className="w-8 h-8 rounded-full border border-black/30 shadow-xs" style={{ backgroundColor: friend.avatar.headColor || '#facc15' }} />
                          {friend.status === 'online' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0.5 right-0.5 shadow-xs" title="Online" />
                          )}
                          {friend.status === 'in_game' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white absolute bottom-0.5 right-0.5 shadow-xs" title="In Game" />
                          )}
                          {friend.status === 'offline' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-gray-400 border-2 border-white absolute bottom-0.5 right-0.5 shadow-xs" title="Offline" />
                          )}
                        </div>

                        {/* Name & Badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <h3 className="font-black text-sm text-gray-900 truncate">{friend.name}</h3>
                            {friend.isTrusted && (
                              <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-1.5 py-0.2 rounded-xs border border-amber-300 flex items-center gap-0.5" title="Trusted Friend: Filter Free">
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                Trusted
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 font-medium mt-0.5">
                            {friend.status === 'in_game' && friend.currentGame ? (
                              <span className="text-blue-600 font-bold flex items-center gap-1">
                                🎮 Playing {mapDisplayNames[friend.currentGame] || friend.currentGame}
                              </span>
                            ) : friend.status === 'online' ? (
                              <span className="text-emerald-600 font-semibold">🟢 Online Now</span>
                            ) : (
                              <span className="text-gray-400">⚪ Offline</span>
                            )}
                          </div>

                          {friend.customStatus && (
                            <p className="text-[11px] text-gray-600 italic bg-gray-50 px-2 py-0.5 rounded-xs mt-1 border border-gray-200 line-clamp-1">
                              &ldquo;{friend.customStatus}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Control Bar */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleSelectFriendChat(friend)}
                            className="bg-[#5c87de] hover:bg-[#215cd4] text-white px-2.5 py-1 rounded-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>

                          {friend.status === 'in_game' && friend.currentGame && (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                if (onPlayGame) onPlayGame(friend.currentGame!, friend.currentRoomCode);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                            >
                              <Gamepad2 className="w-3.5 h-3.5 text-yellow-300" />
                              <span>Join Game</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => handleToggleTrusted(friend.id, e)}
                            className={`p-1 rounded-xs border cursor-pointer transition-colors ${
                              friend.isTrusted 
                                ? 'bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200' 
                                : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                            }`}
                            title={friend.isTrusted ? 'Trusted Status Active (Click to demote)' : 'Mark as Trusted Friend (Bypasses Filter)'}
                          >
                            <ShieldCheck className={`w-4 h-4 ${friend.isTrusted ? 'text-amber-600' : 'text-gray-400'}`} />
                          </button>

                          <button
                            onClick={() => {
                              sounds.playClick();
                              setUnfriendTarget({ id: friend.id, name: friend.name });
                            }}
                            className="px-2 py-1 rounded-xs border border-gray-300 bg-gray-50 hover:bg-red-50 hover:border-red-400 text-gray-600 hover:text-red-600 cursor-pointer transition-colors flex items-center space-x-1 font-bold text-xs"
                            title={`Unfriend ${friend.name}`}
                          >
                            <UserX className="w-3.5 h-3.5 text-red-500" />
                            <span>Unfriend</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right 1 Col: Add Friend & Quick Trusted Code */}
            <div className="space-y-4">
              
              {/* Add Friend Card */}
              <div className="bg-white p-4 rounded-xs border-2 border-[#5c87de] shadow-xs space-y-3">
                <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
                  <UserPlus className="w-5 h-5 text-[#215cd4]" />
                  <h3 className="font-black text-sm text-gray-900">Send Friend Request</h3>
                </div>

                <form onSubmit={handleAddFriendSubmit} className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">Enter Username:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. BlockyMaster"
                      value={addFriendName}
                      onChange={(e) => setAddFriendName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xs focus:bg-white focus:outline-none focus:border-[#215cd4]"
                    />
                    <button
                      type="submit"
                      className="bg-[#215cd4] hover:bg-[#1b439c] text-white font-bold text-xs px-3 py-1.5 rounded-xs transition-colors cursor-pointer shadow-xs flex items-center space-x-1 whitespace-nowrap"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Send Request</span>
                    </button>
                  </div>
                </form>

                {addFriendFeedback && (
                  <div className={`p-2 rounded-xs text-xs font-semibold ${
                    addFriendFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {addFriendFeedback.text}
                  </div>
                )}
              </div>

              {/* Your Trusted Code Quick Access */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-4 rounded-xs border-2 border-amber-400 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <h3 className="font-black text-sm text-yellow-300 tracking-wide">Your Trusted Code</h3>
                  </div>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded-xs font-mono">
                    VERIFIED
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Share this unique code with close friends. When redeemed, you become <strong className="text-amber-300">Trusted Friends</strong> with filter-free chat!
                </p>

                <div className="bg-black/50 p-2.5 rounded-xs border border-amber-400/50 flex items-center justify-between">
                  <code className="text-sm font-mono font-black tracking-widest text-amber-300">{myTrustedCode}</code>
                  <button
                    onClick={handleCopyTrustedCode}
                    className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs px-2.5 py-1 rounded-xs flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Redeem Trusted Code Card */}
              <div className="bg-white p-4 rounded-xs border border-gray-300 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-black text-sm text-gray-900">Redeem Trusted Code</h3>
                </div>

                <form onSubmit={handleRedeemCodeSubmit} className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g. VLX-TRUST-9842"
                    value={redeemCodeInput}
                    onChange={(e) => setRedeemCodeInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xs uppercase font-mono focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 rounded-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center space-x-1"
                  >
                    <ShieldCheck className="w-4 h-4 text-yellow-300" />
                    <span>Redeem Code &amp; Connect</span>
                  </button>
                </form>

                {redeemFeedback && (
                  <div className={`p-2 rounded-xs text-xs font-semibold ${
                    redeemFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {redeemFeedback.text}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 2: PRIVATE MESSAGING --- */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-xs border-2 border-[#5c87de] shadow-md grid grid-cols-1 md:grid-cols-3 min-h-[480px]">
            
            {/* PM Left Sidebar: Friends list */}
            <div className="border-r border-gray-200 bg-gray-50 p-3 space-y-2">
              <h3 className="font-black text-xs text-gray-500 uppercase tracking-wider mb-2">Conversations</h3>
              <div className="space-y-1 overflow-y-auto max-h-[420px]">
                {friends.map((friend) => {
                  const friendMsgs = friendsService.getMessagesWith(friend.id);
                  const unread = friendMsgs.filter(m => m.senderId === friend.id && !m.isRead).length;
                  const isSelected = selectedFriendForChat?.id === friend.id;

                  return (
                    <button
                      key={friend.id}
                      onClick={() => handleSelectFriendChat(friend)}
                      className={`w-full p-2.5 rounded-xs text-left flex items-center justify-between transition-colors cursor-pointer border ${
                        isSelected 
                          ? 'bg-white border-[#215cd4] shadow-xs' 
                          : 'hover:bg-gray-200 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500 border border-black/20 flex items-center justify-center text-white text-xs font-black">
                          {friend.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-gray-900 truncate flex items-center gap-1">
                            {friend.name}
                            {friend.isTrusted && <ShieldCheck className="w-3 h-3 text-amber-500 flex-shrink-0" title="Trusted Friend" />}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {friendMsgs.length > 0 ? friendMsgs[friendMsgs.length - 1].text : 'Start chatting'}
                          </div>
                        </div>
                      </div>

                      {unread > 0 && (
                        <span className="bg-red-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PM Right Panel: Active Chat Box */}
            <div className="md:col-span-2 flex flex-col justify-between bg-white">
              {selectedFriendForChat ? (
                <>
                  {/* Chat Top Bar */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div>
                        <h3 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                          {selectedFriendForChat.name}
                          {selectedFriendForChat.isTrusted && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-xs border border-amber-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-amber-600" />
                              Filter-Free Trusted Connection
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          {selectedFriendForChat.status === 'in_game' ? `In Game: ${selectedFriendForChat.currentGame}` : selectedFriendForChat.status}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => friendsService.toggleTrustedFriend(selectedFriendForChat.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-xs border cursor-pointer transition-colors flex items-center gap-1 ${
                        selectedFriendForChat.isTrusted 
                          ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>{selectedFriendForChat.isTrusted ? 'Trusted (Filter Off)' : 'Make Trusted'}</span>
                    </button>
                  </div>

                  {/* Filter Status Info Banner */}
                  <div className={`px-4 py-1.5 text-xs font-semibold flex items-center gap-2 border-b ${
                    selectedFriendForChat.isTrusted 
                      ? 'bg-amber-50 text-amber-900 border-amber-200' 
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                  }`}>
                    {selectedFriendForChat.isTrusted ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span><strong>Trusted Friends Status:</strong> Messages between you &amp; {selectedFriendForChat.name} bypass AI toxicity filters!</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span><strong>Standard Friend Status:</strong> AI toxicity filters active. Exchange trusted codes to unlock filter-free chat.</span>
                      </>
                    )}
                  </div>

                  {/* Messages Scroll Body */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-3 max-h-[340px] bg-slate-50/50">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 py-12 text-xs font-bold">
                        No messages yet. Send a message to start the conversation!
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.senderId === 'my_user';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center space-x-1 text-[10px] text-gray-400 mb-0.5">
                              <span className="font-bold">{isMe ? 'Me' : msg.senderName}</span>
                              <span>•</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div
                              className={`max-w-[80%] p-2.5 rounded-sm text-xs font-medium border shadow-2xs ${
                                isMe 
                                  ? 'bg-[#215cd4] text-white border-[#1b439c] rounded-tr-none' 
                                  : 'bg-white text-gray-800 border-gray-200 rounded-tl-none'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendPM} className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
                    <input
                      type="text"
                      placeholder={`Message ${selectedFriendForChat.name}...`}
                      value={inputMessageText}
                      onChange={(e) => setInputMessageText(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus:outline-none focus:border-[#215cd4]"
                    />
                    <button
                      type="submit"
                      className="bg-[#215cd4] hover:bg-[#1b439c] text-white font-bold text-xs px-4 py-2 rounded-xs transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                  <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="font-bold text-sm">Select a friend to open Private Messaging</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 3: TRUSTED FRIENDS & CODE SYSTEM --- */}
        {activeTab === 'trusted' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xs border-2 border-amber-400 shadow-md space-y-4">
              <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Trusted Friends &amp; Filter Bypass Protocol</h2>
                  <p className="text-xs text-gray-500">
                    Trusted Friends are verified connections who can exchange messages and join private games with total freedom!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-amber-50/60 p-3 rounded-xs border border-amber-200 space-y-1">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1">
                    <Unlock className="w-4 h-4 text-amber-600" />
                    1. Filter Bypass
                  </h4>
                  <p className="text-amber-800/90 leading-relaxed">
                    Private messages and in-game chat between verified Trusted Friends skip strict AI moderation algorithms.
                  </p>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-xs border border-emerald-200 space-y-1">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1">
                    <Key className="w-4 h-4 text-emerald-600" />
                    2. Instant Code Exchange
                  </h4>
                  <p className="text-emerald-800/90 leading-relaxed">
                    Exchanging unique Trusted Codes automatically grants Trusted status without needing manual approval.
                  </p>
                </div>

                <div className="bg-purple-50/60 p-3 rounded-xs border border-purple-200 space-y-1">
                  <h4 className="font-bold text-purple-900 flex items-center gap-1">
                    <Lock className="w-4 h-4 text-purple-600" />
                    3. VIP Private Rooms
                  </h4>
                  <p className="text-purple-800/90 leading-relaxed">
                    Gain exclusive access to private P2P servers marked for Trusted Friends only.
                  </p>
                </div>
              </div>

              {/* Code Banner */}
              <div className="bg-slate-900 text-white p-5 rounded-xs border border-amber-400/80 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-yellow-300 uppercase tracking-wider">Your Personal Trusted Code</h3>
                  <p className="text-xs text-gray-300">Give this code to friends you trust completely.</p>
                </div>

                <div className="flex items-center space-x-3 bg-black/60 px-4 py-2 rounded-xs border border-amber-400">
                  <code className="text-lg font-mono font-black text-amber-300 tracking-widest">{myTrustedCode}</code>
                  <button
                    onClick={handleCopyTrustedCode}
                    className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs px-3 py-1.5 rounded-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              {/* Redeem Box */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-black text-sm text-gray-900 mb-2">Redeem Friend&apos;s Trusted Code</h3>
                <form onSubmit={handleRedeemCodeSubmit} className="flex gap-2 max-w-lg">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. VLX-TRUST-9842)"
                    value={redeemCodeInput}
                    onChange={(e) => setRedeemCodeInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xs uppercase font-mono focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xs transition-colors cursor-pointer shadow-xs flex items-center space-x-1"
                  >
                    <ShieldCheck className="w-4 h-4 text-yellow-300" />
                    <span>Redeem &amp; Upgrade</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: PRIVATE P2P GAMES --- */}
        {activeTab === 'private_games' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Active Private Servers */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-xs border border-gray-300 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-purple-600" />
                    Active Private P2P Games
                  </h3>
                  <p className="text-xs text-gray-500">Hosted by you and your friends</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-xs border border-purple-200">
                  Direct Peer-to-Peer
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {privateGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white p-4 rounded-xs border-2 border-purple-300 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-xs uppercase tracking-wider">
                          {game.mapId}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-500">{game.roomCode}</span>
                      </div>
                      <h4 className="font-black text-sm text-gray-900">{game.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Host: <strong>{game.hostName}</strong></p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-600 font-semibold">
                        👥 {game.currentPlayers}/{game.maxPlayers} Players
                      </div>

                      <button
                        onClick={() => {
                          sounds.playClick();
                          if (onPlayGame) onPlayGame(game.mapId, game.roomCode);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Join Private Game</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1 Col: Create Private P2P Server */}
            <div className="bg-white p-5 rounded-xs border-2 border-purple-400 shadow-xs space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  Create Private P2P Server
                </h3>
                <p className="text-xs text-gray-500">Host your own custom private room for friends</p>
              </div>

              <form onSubmit={handleCreatePrivateGame} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Server Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. VIP Crossroads Chill"
                    value={createGameName}
                    onChange={(e) => setCreateGameName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xs focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Select Place / Map:</label>
                  <select
                    value={createGameMap}
                    onChange={(e) => setCreateGameMap(e.target.value as MapTemplateId)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xs focus:outline-none focus:border-purple-600 font-bold"
                  >
                    <option value="crossroads">Crossroads (Classic Combat)</option>
                    <option value="physics_lab">Chaos Canyon (Physics)</option>
                    <option value="happy_home">Happy Home (Town)</option>
                    <option value="baseplate">Baseplate Builder (Sandbox)</option>
                    <option value="obby">Verlex Obby IV</option>
                    <option value="studio_map">Creative Studio</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Access Control:</label>
                  <select
                    value={createGameAccess}
                    onChange={(e) => setCreateGameAccess(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xs focus:outline-none focus:border-purple-600 font-semibold"
                  >
                    <option value="friends_only">👥 All Friends Only</option>
                    <option value="trusted_only">🛡️ Trusted Friends Only</option>
                    <option value="code_required">🔑 Password Protected</option>
                  </select>
                </div>

                {createGameAccess === 'code_required' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Room Passcode:</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234"
                      value={createGamePasscode}
                      onChange={(e) => setCreateGamePasscode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xs focus:outline-none focus:border-purple-600"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 rounded-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center space-x-1"
                >
                  <Gamepad2 className="w-4 h-4 text-yellow-300" />
                  <span>Launch &amp; Host Private Server</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 5: SOCIAL ACTIVITY --- */}
        {activeTab === 'activity' && (
          <div className="bg-white p-5 rounded-xs border border-gray-300 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              Social Activity Log
            </h3>

            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="p-3 bg-gray-50 rounded-xs border border-gray-200 flex items-center space-x-3 text-xs">
                  <span className="text-xl">{act.icon || '✨'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      <strong className="text-gray-900">{act.friendName}</strong> {act.action}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 6: P2P SIGNED-UP PLAYERS DATABASE (OLDEST TO NEWEST) --- */}
        {activeTab === 'players_database' && (
          <div className="bg-white p-5 rounded-xs border border-gray-300 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-200 pb-3 gap-2">
              <div>
                <h3 className="font-black text-base text-indigo-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  P2P Signed-Up Player Storage Database
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  All signed up player accounts stored sequentially in local P2P database, ordered strictly from <strong className="text-indigo-700 font-bold">Newest (Most Recent) to Oldest</strong>.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded border border-gray-300">
                  Total Players: {registeredPlayers.length}
                </span>
              </div>
            </div>

            {/* List of Registered Accounts */}
            <div className="divide-y divide-gray-200 border border-gray-200 rounded overflow-hidden">
              {registeredPlayers.map((p) => {
                const isCurrent = currentName.toLowerCase() === p.username.toLowerCase();
                const isFriend = friends.some((f) => f.name.toLowerCase() === p.username.toLowerCase());

                return (
                  <div
                    key={p.id}
                    className={`p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                      isCurrent ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-indigo-100 text-indigo-800 font-black text-xs flex flex-col items-center justify-center border border-indigo-200 shadow-xs">
                        <span className="text-[9px] text-indigo-500 font-mono">REG</span>
                        <span>#{p.registeredIndex}</span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-sm text-gray-900">{p.username}</span>
                          {p.isUnlimitedVBucks && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded border border-emerald-400 shadow-2xs">
                              ∞ Unlimited V$
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded shadow-2xs">
                              ★ Active User
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            Signed Up: {p.registeredAt}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-gray-600">
                            Status: {p.status === 'online' ? '🟢 Online' : p.status === 'in_game' ? '🎮 In Game' : '⚪ Offline'}
                          </span>
                          {p.currentGame && (
                            <span className="text-blue-600 font-bold">
                              Playing: {p.currentGame}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            if (onSwitchAccount) {
                              onSwitchAccount(p.username);
                            } else {
                              localStorage.setItem('verlex_player_name', p.username);
                              window.location.reload();
                            }
                          }}
                          className="px-3 py-1.5 bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white text-xs font-bold rounded shadow-xs transition cursor-pointer flex items-center space-x-1"
                          title={`Switch active account to ${p.username}`}
                        >
                          <Key className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Switch Account</span>
                        </button>
                      )}

                      {!isCurrent && (() => {
                        const pendingStatus = friendsService.hasPendingRequestWith(p.username);
                        if (isFriend) {
                          return (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setUnfriendTarget({ id: p.username, name: p.username });
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 font-bold text-xs rounded border border-gray-300 hover:border-red-400 flex items-center space-x-1 transition cursor-pointer"
                              title={`Unfriend ${p.username}`}
                            >
                              <UserX className="w-3.5 h-3.5 text-red-500" />
                              <span>Unfriend</span>
                            </button>
                          );
                        } else if (pendingStatus === 'incoming') {
                          return (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  sounds.playClick();
                                  const res = friendsService.acceptFriendRequest(p.username);
                                  if (res.success) {
                                    setAddFriendFeedback({ type: 'success', text: res.message });
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs flex items-center space-x-1 transition cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Accept Request</span>
                              </button>
                              <button
                                onClick={() => {
                                  sounds.playClick();
                                  friendsService.declineFriendRequest(p.username);
                                }}
                                className="px-2 py-1.5 bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700 font-bold text-xs rounded border border-gray-300 transition cursor-pointer"
                                title="Decline Request"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        } else if (pendingStatus === 'outgoing') {
                          return (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                friendsService.cancelOutgoingRequest(p.username);
                              }}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-red-50 text-amber-800 hover:text-red-700 font-bold text-xs rounded border border-amber-300 hover:border-red-300 flex items-center space-x-1 transition cursor-pointer"
                              title="Click to cancel outgoing friend request"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>Pending (Cancel)</span>
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                const res = friendsService.sendFriendRequest(p.username);
                                if (res.success) {
                                  setAddFriendFeedback({ type: 'success', text: res.message });
                                } else {
                                  setAddFriendFeedback({ type: 'error', text: res.message });
                                }
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs transition cursor-pointer flex items-center space-x-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Send Friend Request</span>
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- UNFRIEND CONFIRMATION MODAL --- */}
        {unfriendTarget && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-red-600 rounded-xs shadow-2xl p-5 max-w-sm w-full space-y-4 font-sans select-none animate-in fade-in zoom-in duration-150">
              <div className="flex items-center space-x-3 text-red-600 border-b border-gray-200 pb-3">
                <UserX className="w-6 h-6 shrink-0" />
                <h3 className="font-black text-lg text-gray-900">Unfriend {unfriendTarget.name}?</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to remove <strong className="text-gray-900">{unfriendTarget.name}</strong> from your friends list? You will no longer share live P2P status or private messages with them.
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setUnfriendTarget(null);
                  }}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    friendsService.unfriend(unfriendTarget.id);
                    setUnfriendTarget(null);
                  }}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xs shadow-xs cursor-pointer flex items-center space-x-1.5 transition"
                >
                  <UserX className="w-4 h-4" />
                  <span>Unfriend</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
