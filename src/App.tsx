/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  AvatarConfig, 
  ChatMessage, 
  CollabEmoteType,
  GameServer,
  MapTemplateId, 
  PartData, 
  PartMaterial, 
  PartShape, 
  RemixedPlace,
  SitePage, 
  SurfaceType, 
  ToolType 
} from './types';
import { GameEngine } from './game/GameEngine';
import { sounds } from './game/soundEngine';
import { network } from './network/p2pNetwork';
import { serverRegistry } from './services/serverRegistry';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { GamesPage } from './components/GamesPage';
import { MyVerlexPage } from './components/MyVerlexPage';
import { CatalogPage } from './components/CatalogPage';
import { ForumPage } from './components/ForumPage';
import { VerlexStudioPage } from './components/VerlexStudioPage';
import { BuildersClubPage } from './components/BuildersClubPage';
import { FilterTrainerPage } from './components/FilterTrainerPage';
import { FriendsPage } from './components/FriendsPage';
import { friendsService } from './services/friendsService';
import { LoginModal } from './components/LoginModal';
import { Topbar } from './components/Topbar';
import { Hotbar } from './components/Hotbar';
import { BuildToolbar } from './components/BuildToolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ChatBox } from './components/ChatBox';
import { AvatarEditor } from './components/AvatarEditor';
import { MultiplayerModal } from './components/MultiplayerModal';
import { ServerBrowserModal } from './components/ServerBrowserModal';
import { HelpModal } from './components/HelpModal';
import { MobileControls } from './components/MobileControls';
import { InGameMenu } from './components/InGameMenu';
import { GamePassesModal } from './components/GamePassesModal';
import { InGameLeaderboardWidget } from './components/InGameLeaderboardWidget';
import { inGameChatScript } from './services/inGameChatScript';
import { Heart, Trophy, Crosshair, ArrowLeft, Radio } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  // Site Navigation & Account State
  const [currentSitePage, setCurrentSitePage] = useState<SitePage>('home');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedName = localStorage.getItem('verlex_player_name');
    if (savedName && savedName.toLowerCase().includes('testingaccount')) {
      return false;
    }
    return localStorage.getItem('verlex_logged_in') === 'true';
  });
  const [playerName, setPlayerName] = useState<string>(() => {
    const saved = localStorage.getItem('verlex_player_name');
    if (!saved || saved.toLowerCase().includes('testingaccount')) {
      const guestNum = Math.floor(1000 + Math.random() * 9000);
      const guestName = `Guest-${guestNum}`;
      localStorage.setItem('verlex_player_name', guestName);
      localStorage.setItem('verlex_logged_in', 'false');
      return guestName;
    }
    return saved;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Avatar Configuration (- Noob / Robloxian)
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('verlex_avatar_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      headColor: '#f5cd2f',
      torsoColor: '#0d69ac',
      leftArmColor: '#f5cd2f',
      rightArmColor: '#f5cd2f',
      leftLegColor: '#a4bd46',
      rightLegColor: '#a4bd46',
      face: 'smile',
      hat: 'verlex_cap',
      tshirt: '_r',
    };
  });

  // In-Game State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [currentMap, setCurrentMap] = useState<MapTemplateId>('crossroads');
  const [health, setHealth] = useState<number>(100);
  const [maxHealth] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShiftLock, setIsShiftLock] = useState<boolean>(false);

  // Dynamic Sizer, Scale, and ESC Menu State
  const [screenScaleMode, setScreenScaleMode] = useState<'full' | '16-9' | '4-3' | 'phone'>('full');
  const [resolutionScale, setResolutionScale] = useState<number>(1.0);
  const [showInGameMenu, setShowInGameMenu] = useState<boolean>(false);

  // Build Tool State
  const [buildShape, setBuildShape] = useState<PartShape>('block');
  const [buildColor, setBuildColor] = useState<string>('#c4281c');
  const [buildMaterial, setBuildMaterial] = useState<PartMaterial>('plastic');
  const [buildSurfaceType, setBuildSurfaceType] = useState<SurfaceType>('studs');
  const [buildSize, setBuildSize] = useState<[number, number, number]>([4, 2, 4]);
  const [buildAnchored, setBuildAnchored] = useState<boolean>(false);
  const [gridSnap, setGridSnap] = useState<number>(2);

  // Server & P2P State
  const [roomCode, setRoomCode] = useState<string>('CR-');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [peerCount, setPeerCount] = useState<number>(0);
  const [showServerBrowserModal, setShowServerBrowserModal] = useState<boolean>(false);
  const [serverBrowserMapFilter, setServerBrowserMapFilter] = useState<MapTemplateId | 'all'>('all');

  // In-Game Modals & Chat State
  const [showAvatarEditor, setShowAvatarEditor] = useState<boolean>(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showInGameStoreModal, setShowInGameStoreModal] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      senderId: 'system',
      senderName: 'System',
      text: 'Welcome to VERLEX ! P2P Multiplayer is enabled for all places.',
      timestamp: Date.now(),
      isSystem: true,
    },
  ]);

  // Save Avatar Config & Login
  const handleSaveAvatarConfig = (updated: Partial<AvatarConfig>) => {
    const newConfig = { ...avatarConfig, ...updated };
    setAvatarConfig(newConfig);
    localStorage.setItem('verlex_avatar_config', JSON.stringify(newConfig));
    if (engineRef.current) {
      engineRef.current.localAvatar.updateConfig(newConfig);
    }
  };

  const handleLogin = (name: string) => {
    setPlayerName(name);
    setIsLoggedIn(true);
    localStorage.setItem('verlex_player_name', name);
    localStorage.setItem('verlex_logged_in', 'true');
    if (engineRef.current) {
      engineRef.current.playerName = name;
      engineRef.current.localAvatar.name = name;
      engineRef.current.localAvatar.updateNameTag(name, health, maxHealth);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const guestName = `Guest-${guestNum}`;
    setPlayerName(guestName);
    localStorage.setItem('verlex_player_name', guestName);
    localStorage.setItem('verlex_logged_in', 'false');
    if (engineRef.current) {
      engineRef.current.playerName = guestName;
      engineRef.current.localAvatar.name = guestName;
      engineRef.current.localAvatar.updateNameTag(guestName, health, maxHealth);
    }
  };

  const [activeRemixPlace, setActiveRemixPlace] = useState<RemixedPlace | null>(null);

  // Join a specific server
  const handleJoinServer = (server: GameServer) => {
    sounds.playClick();
    setCurrentMap(server.mapId);
    setRoomCode(server.roomCode);
    setCurrentSitePage('play_3d');
    serverRegistry.updatePlayerCount(server.roomCode, 1);
  };

  // Launch In-Game 3D Play (defaults to map's active server join code)
  const handleLaunch3DGame = (
    mapId: MapTemplateId = 'crossroads', 
    customPlace?: RemixedPlace | null,
    customRoomCode?: string
  ) => {
    if (customPlace) {
      setActiveRemixPlace(customPlace);
      try {
        localStorage.setItem('verlex_active_custom_place', JSON.stringify(customPlace));
      } catch (e) {}
    } else if (mapId !== 'studio_map') {
      setActiveRemixPlace(null);
      localStorage.removeItem('verlex_active_custom_place');
    }

    let roomCode = customRoomCode || `P2P-${Math.floor(1000 + Math.random() * 9000)}`;
    let maxPlayers = 12;
    let name = customPlace ? customPlace.title : 'My Personal Sandbox';

    if (customRoomCode) {
      const customServer: GameServer = {
        id: `srv_custom_${Date.now()}`,
        roomCode: customRoomCode,
        mapId,
        name: customPlace ? `${customPlace.title} [${customRoomCode}]` : `Private Game [${customRoomCode}]`,
        hostName: 'Peer Host',
        playerCount: 1,
        maxPlayers: 10,
        region: 'Private P2P',
        ping: 20,
        createdAt: Date.now(),
        isCustom: true,
      };
      handleJoinServer(customServer);
      return;
    }

    if (mapId === 'studio_map' || customPlace) {
      try {
        const studioNet = JSON.parse(localStorage.getItem('verlex_studio_network') || '{}');
        if (studioNet.roomCode) roomCode = studioNet.roomCode;
        if (studioNet.maxPlayers) maxPlayers = studioNet.maxPlayers;
        if (customPlace) name = customPlace.title;
        else name = 'Verlex Studio Run';
      } catch (e) {}
      
      const hostServer: GameServer = {
        id: `srv_${Date.now()}`,
        roomCode: roomCode,
        mapId: 'studio_map',
        name: name,
        hostName: playerName,
        playerCount: 1,
        maxPlayers: maxPlayers,
        region: 'Local / P2P',
        ping: 0,
        createdAt: Date.now(),
        isCustom: true,
      };
      
      handleJoinServer(hostServer);
      return;
    }

    const def = serverRegistry.getDefaultServerForMap(mapId);
    handleJoinServer(def);
  };

  const handleOpenServerBrowser = (mapId: MapTemplateId | 'all' = 'all') => {
    setServerBrowserMapFilter(mapId);
    setShowServerBrowserModal(true);
  };

  // Initialize P2P friends system whenever the player name changes
  useEffect(() => {
    friendsService.initSocialP2P(playerName);
  }, [playerName]);

  // 1. Initialize GameEngine and P2P Server Connection whenever in play_3d mode
  useEffect(() => {
    if (currentSitePage !== 'play_3d') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
        setEngineReady(false);
      }
      network.cleanup();
      setIsConnected(false);
      return;
    }

    if (!containerRef.current) return;

    // Initialize 3D Engine
    const engine = new GameEngine(
      containerRef.current,
      playerName,
      avatarConfig,
      {
        onSelectedPartChange: (part) => setSelectedPart(part),
        onPlayerStatsChange: (hp, maxHp, sc) => {
          setHealth(hp);
          setScore(sc);
        },
        onActiveToolChange: (tool) => setActiveTool(tool),
      }
    );

    engineRef.current = engine;
    setEngineReady(true);
    const customParts = currentMap === 'studio_map' ? (activeRemixPlace?.parts || undefined) : undefined;
    engine.loadMap(currentMap, customParts);

    // Track shift-lock state
    const interval = setInterval(() => {
      if (engineRef.current) {
        setIsShiftLock(engineRef.current.shiftLockEnabled);
      }
    }, 150);

    // Setup P2P Network Handlers
    network.onChatMessageReceived = async (msg) => {
      let textToUse = msg.text;
      const isTrustedSender = friendsService.isTrustedFriend(msg.senderName);

      if (!isTrustedSender) {
        try {
          const res = await fetch('/api/chat/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: msg.text })
          });
          if (res.ok) {
            const data = await res.json();
            textToUse = data.filteredText;
          }
        } catch (err) {
          console.error('Error filtering incoming message:', err);
        }
      }

      const displayTag = isTrustedSender ? `🛡️ ${msg.senderName}` : msg.senderName;
      const filteredMsg = { ...msg, text: textToUse, senderName: displayTag };
      setChatMessages((prev) => [...prev, filteredMsg]);
      if (engineRef.current && textToUse) {
        const remoteAvatar = engineRef.current.remotePlayers.get(msg.senderId);
        if (remoteAvatar) {
          remoteAvatar.updateNameTag(`${displayTag}: "${textToUse}"`, 100, 100);
          setTimeout(() => {
            remoteAvatar.updateNameTag(msg.senderName, 100, 100);
          }, 4000);
        }
      }
    };

    network.onPeerConnect = (peerId) => {
      const count = network.connections.size;
      setPeerCount(count);
      serverRegistry.updatePlayerCount(roomCode, count + 1);

      const pName = network.peerNames.get(peerId) || 'A player';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `join_${Date.now()}_${Math.random()}`,
          senderId: 'system',
          senderName: 'System',
          text: `${pName} joined the server! (${count + 1} players online)`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    };

    network.onPeerDisconnect = (peerId) => {
      if (engineRef.current) engineRef.current.handlePeerDisconnect(peerId);
      const count = network.connections.size;
      setPeerCount(count);
      serverRegistry.updatePlayerCount(roomCode, count + 1);

      setChatMessages((prev) => [
        ...prev,
        {
          id: `leave_${Date.now()}_${Math.random()}`,
          senderId: 'system',
          senderName: 'System',
          text: `A player left the server. (${count + 1} players online)`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    };

    network.onPlayerCountChange = (count) => {
      setPeerCount(Math.max(0, count - 1));
    };

    // Auto-Connect to the Server / Join Code
    setIsConnecting(true);
    const targetCode = roomCode || serverRegistry.getDefaultServerForMap(currentMap).roomCode;
    setRoomCode(targetCode);

    network.joinOrCreateServer(targetCode, currentMap, playerName).then((res) => {
      setIsConnecting(false);
      setIsConnected(res.success);
      setIsHost(res.isHost);
      setRoomCode(res.roomCode);

      setChatMessages((prev) => [
        ...prev,
        {
          id: `sys_connect_${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          text: `Connected to Server [${res.roomCode}] (${res.isHost ? 'Host' : 'Client'}). Share Join Code "${res.roomCode}" with friends to play together!`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    });

    return () => {
      clearInterval(interval);
      engine.destroy();
      engineRef.current = null;
        setEngineReady(false);
      network.cleanup();
    };
  }, [currentSitePage, currentMap, roomCode]);

  // Sync Build Toolbar settings to GameEngine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.buildShape = buildShape;
      engineRef.current.buildColor = buildColor;
      engineRef.current.buildMaterial = buildMaterial;
      engineRef.current.buildSurfaceType = buildSurfaceType;
      engineRef.current.buildSize = buildSize;
      engineRef.current.buildAnchored = buildAnchored;
      engineRef.current.gridSnap = gridSnap;
    }
  }, [buildShape, buildColor, buildMaterial, buildSurfaceType, buildSize, buildAnchored, gridSnap]);

  // Sync Resolution Scale & update canvas
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.resolutionScale = resolutionScale;
      // Dispatch a window resize event to trigger ResizeObserver & adjust projection matrix
      window.dispatchEvent(new Event('resize'));
    }
  }, [resolutionScale, screenScaleMode]);

  // Keyboard Escape toggler for Home Menu
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentSitePage === 'play_3d') {
        setShowInGameMenu((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [currentSitePage]);

  // World Event Handler (Low Gravity, Rain Blocks, Tsunami, Nuke)
  const handleTriggerWorldEvent = (eventType: 'gravity' | 'rain' | 'nuke' | 'tsunami') => {
    if (engineRef.current) {
      engineRef.current.triggerWorldEvent(eventType);
      
      // Send dynamic system chat message
      const eventNames = {
        gravity: 'LUNAR LOW GRAVITY',
        rain: 'METEOR BLOCK SHOWER',
        tsunami: 'PHYSICS TSUNAMI WAVE',
        nuke: 'DETONATE ALL TNT',
      };
      
      setChatMessages((prev) => [
        ...prev,
        {
          id: `sys_event_${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          text: `🔔 Server Moderator triggered event: [${eventNames[eventType]}]!`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    }
  };

  // Switch Tool Handler
  const handleSelectTool = (tool: ToolType) => {
    setActiveTool(tool);
    if (engineRef.current) {
      engineRef.current.setTool(tool);
    }
  };

  // Map Change Handler
  const handleSelectMap = (mapId: MapTemplateId) => {
    const def = serverRegistry.getDefaultServerForMap(mapId);
    handleJoinServer(def);
  };

  // Reset Character Handler
  const handleResetCharacter = () => {
    if (engineRef.current) {
      sounds.playOof();
      engineRef.current.damagePlayer(100);
    }
  };

  // Mute Audio Toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  // Shift-Lock Toggle
  const handleToggleShiftLock = () => {
    if (engineRef.current) {
      engineRef.current.shiftLockEnabled = !engineRef.current.shiftLockEnabled;
      setIsShiftLock(engineRef.current.shiftLockEnabled);
      if (engineRef.current.shiftLockEnabled) {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouch) {
          containerRef.current?.querySelector('canvas')?.requestPointerLock?.();
        }
      } else {
        document.exitPointerLock?.();
      }
    }
  };

  // Trigger Emote
  const handleTriggerEmote = (emote: 'dance' | 'wave' | 'cheer' | 'sit' | CollabEmoteType) => {
    if (engineRef.current) {
      engineRef.current.triggerEmote(emote);
    }
    setChatMessages((prev) => [
      ...prev,
      {
        id: `emote_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `${playerName} emote: /e ${emote}`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  };

  // Chat Send Handler
  const handleSendMessage = async (text: string) => {
    // 1. Check for chat script slash commands (/e, /help, /speed, /reset, /clear, /verbucks, /tp, /stats)
    const cmdResult = inGameChatScript.parseAndExecute(text, engineRef.current);
    if (cmdResult.isCommand) {
      if (cmdResult.triggerEmote) {
        handleTriggerEmote(cmdResult.triggerEmote as any);
      }
      if (cmdResult.triggerReset) {
        handleResetCharacter();
      }
      if (cmdResult.triggerClear) {
        setChatMessages([]);
      }
      if (cmdResult.systemResponse) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `sys_cmd_${Date.now()}_${Math.random()}`,
            senderId: 'system',
            senderName: 'System',
            text: cmdResult.systemResponse!,
            timestamp: Date.now(),
            isSystem: true,
          },
        ]);
      }
      return;
    }

    let displayAndBroadcastText = text;
    let isFlagged = false;
    try {
      const res = await fetch('/api/chat/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        displayAndBroadcastText = data.filteredText;
        isFlagged = data.isFlagged;
      }
    } catch (err) {
      console.error('Filter api call failed, using raw chat text:', err);
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: engineRef.current?.myPlayerId || 'me',
      senderName: playerName,
      text: displayAndBroadcastText,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    network.broadcastChat(newMsg);

    if (engineRef.current) {
      engineRef.current.displayChatBubble(displayAndBroadcastText);
    }

    if (isFlagged) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `warn_${Date.now()}_${Math.random()}`,
          senderId: 'system',
          senderName: 'System',
          text: `Your message was filtered by the Verlex AI Filter System.`,
          timestamp: Date.now(),
          isSystem: true,
        }
      ]);
    }
  };

  // Direct Join Room from Modal
  const handleJoinRoomFromModal = (code: string) => {
    sounds.playClick();
    const found = serverRegistry.findServerByCode(code);
    if (found) {
      handleJoinServer(found);
    } else {
      setRoomCode(code.toUpperCase());
    }
    setShowMultiplayerModal(false);
  };

  // Properties Panel Actions
  const handleUpdateSelectedPart = (updated: PartData) => {
    setSelectedPart(updated);
    if (engineRef.current) {
      engineRef.current.updatePart(updated, true);
    }
  };

  const handleDeleteSelectedPart = (id: string) => {
    if (engineRef.current) {
      engineRef.current.removePart(id, true);
    }
  };

  const handleDuplicateSelectedPart = (part: PartData) => {
    if (engineRef.current) {
      const newPart: PartData = {
        ...part,
        id: `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        position: [part.position[0] + 4, part.position[1] + 2, part.position[2] + 4],
      };
      engineRef.current.addPart(newPart, true);
      engineRef.current.setSelectedPart(newPart);
    }
  };

  // Render 3D In-Game Mode
  if (currentSitePage === 'play_3d') {
    const getContainerStyles = (): React.CSSProperties => {
      switch (screenScaleMode) {
        case '16-9':
          return {
            aspectRatio: '16/9',
            width: '92%',
            height: 'auto',
            maxWidth: '1280px',
            maxHeight: '85%',
            borderRadius: '24px',
            border: '14px solid #1f1f1f',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.5)',
          };
        case '4-3':
          return {
            aspectRatio: '4/3',
            width: '80%',
            height: 'auto',
            maxWidth: '960px',
            maxHeight: '85%',
            borderRadius: '24px',
            border: '14px solid #1f1f1f',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.5)',
          };
        case 'phone':
          return {
            aspectRatio: '9/16',
            width: '370px',
            height: '82%',
            maxHeight: '740px',
            borderRadius: '40px',
            border: '16px solid #1f1f1f',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.5)',
          };
        case 'full':
        default:
          return {
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
          };
      }
    };

    return (
      <div id="verlex-3d-client-view" className="fixed inset-0 w-full h-full overflow-hidden bg-neutral-950 select-none font-sans flex items-center justify-center">
        {/* Three.js Canvas Container Centered Wrapper */}
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/95 z-0 p-4">
          <div 
            ref={containerRef} 
            style={getContainerStyles()}
            className="relative overflow-hidden cursor-crosshair bg-neutral-900 transition-all duration-300"
          />
        </div>

        {/* Topbar Navigation & Actions */}
        <Topbar
          currentMap={currentMap}
          onSelectMap={handleSelectMap}
          onOpenMultiplayer={() => setShowMultiplayerModal(true)}
          onOpenServerBrowser={() => handleOpenServerBrowser(currentMap)}
          onOpenAvatarEditor={() => setShowAvatarEditor(true)}
          onOpenHelp={() => setShowHelpModal(true)}
          onResetCharacter={handleResetCharacter}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onTriggerEmote={handleTriggerEmote}
          peerCount={peerCount}
          roomCode={roomCode}
          isHost={isHost}
          isShiftLock={isShiftLock}
          onToggleShiftLock={handleToggleShiftLock}
          onOpenGameStore={() => {
            sounds.playClick();
            setShowInGameStoreModal(true);
          }}
          onExit={() => setCurrentSitePage('home')}
          onOpenInGameMenu={() => {
            sounds.playClick();
            setShowInGameMenu(true);
          }}
        />

        {/* In-Game Chat Box */}
        <ChatBox
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          myPlayerId={engineRef.current?.myPlayerId || 'me'}
        />

        {/* Floating Build Toolbar (Visible when Build or Paint is active) */}
        {(activeTool === 'build' || activeTool === 'paint') && (
          <BuildToolbar
            shape={buildShape}
            onShapeChange={(s) => {
              setBuildShape(s);
              if (s === 'dummy') {
                setBuildSize([4, 5, 1]);
              } else if (s === 'sphere') {
                setBuildSize([3, 3, 3]);
              } else if (buildSize[0] === 4 && buildSize[1] === 5 && buildSize[2] === 1) {
                setBuildSize([4, 2, 4]);
              }
            }}
            color={buildColor}
            onColorChange={setBuildColor}
            material={buildMaterial}
            onMaterialChange={setBuildMaterial}
            surfaceType={buildSurfaceType}
            onSurfaceTypeChange={setBuildSurfaceType}
            size={buildSize}
            onSizeChange={setBuildSize}
            anchored={buildAnchored}
            onAnchoredChange={setBuildAnchored}
            gridSnap={gridSnap}
            onGridSnapChange={setGridSnap}
            onRotate={() => {
              if (engineRef.current) {
                engineRef.current.buildRotationAngle =
                  (engineRef.current.buildRotationAngle + Math.PI / 2) % (Math.PI * 2);
              }
            }}
          />
        )}

        {/* Properties Panel (Visible when a Part is selected) */}
        {selectedPart && activeTool === 'select' && (
          <PropertiesPanel
            part={selectedPart}
            onUpdate={handleUpdateSelectedPart}
            onDelete={handleDeleteSelectedPart}
            onDuplicate={handleDuplicateSelectedPart}
            onClose={() => {
              setSelectedPart(null);
              if (engineRef.current) {
                engineRef.current.setSelectedPart(null);
              }
            }}
          />
        )}

        {/* Player Leaderboard & Health HUD (Top Right Classic Roblox) */}
        <InGameLeaderboardWidget
          health={health}
          maxHealth={maxHealth}
          score={score}
          playerName={playerName}
          peerCount={peerCount}
          roomCode={roomCode}
        />

        {/* Crosshair Overlay (ShiftLock or Weapons) */}
        {(isShiftLock || activeTool === 'rocket' || activeTool === 'gravity') && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative">
              <Crosshair className="w-6 h-6 text-white/70 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
              <div className="absolute inset-0 m-auto w-1 h-1 bg-red-500 rounded-full" />
            </div>
          </div>
        )}

        {/* Death Screen Overlay */}
        {health === 0 && (
          <div className="absolute inset-0 z-40 bg-red-950/45 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-neutral-950/95 border-2 border-red-800 rounded-3xl p-6 sm:p-8 max-w-sm text-center shadow-[0_0_50px_rgba(239,68,68,0.35)]">
              <span className="text-4xl sm:text-5xl mb-2 block animate-pulse">💀</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-red-500 tracking-wider mb-2 uppercase">Wasted</h2>
              <p className="text-neutral-300 text-sm mb-4">You collapsed into a physical ragdoll.</p>
              <div className="text-xs text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-full inline-block border border-neutral-800">
                🪦 A burial site has been erected at your death spot
              </div>
            </div>
          </div>
        )}

        {/* Mobile Touch Controls */}
        {engineReady && <MobileControls engine={engineRef.current} />}

        {/* Bottom Backpack / Hotbar (Keys 1-8) */}
        <Hotbar activeTool={activeTool} onSelectTool={handleSelectTool} />

        {/* Avatar Editor Modal */}
        {showAvatarEditor && (
          <AvatarEditor
            config={avatarConfig}
            onChange={handleSaveAvatarConfig}
            onClose={() => setShowAvatarEditor(false)}
          />
        )}

        {/* Multiplayer P2P Modal */}
        {showMultiplayerModal && (
          <MultiplayerModal
            roomCode={roomCode}
            isConnected={isConnected}
            isConnecting={isConnecting}
            peerCount={peerCount}
            onHostRoom={() => network.hostRoom().then((code) => setRoomCode(code))}
            onJoinRoom={handleJoinRoomFromModal}
            onClose={() => setShowMultiplayerModal(false)}
          />
        )}

        {/* Server Browser Modal */}
        <ServerBrowserModal
          isOpen={showServerBrowserModal}
          onClose={() => setShowServerBrowserModal(false)}
          onJoinServer={handleJoinServer}
          selectedMapFilter={serverBrowserMapFilter}
          activeRoomCode={roomCode}
          activePeerCount={peerCount}
        />

        {/* Help & Controls Modal */}
        {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}

        {/* In-Game Store / Game Passes Modal */}
        <GamePassesModal
          isOpen={showInGameStoreModal}
          onClose={() => setShowInGameStoreModal(false)}
          gameId={currentMap}
          gameTitle={currentMap === 'crossroads' ? 'Crossroads' : currentMap === 'happy_home' ? 'Happy Home' : currentMap === 'physics_lab' ? 'Chaos Canyon' : currentMap === 'obby' ? 'Chaos Obby' : 'Baseplate'}
          playerName={playerName}
        />

        {/* In-Game ESC / Home Menu Overlay */}
        <InGameMenu
          isOpen={showInGameMenu}
          onClose={() => setShowInGameMenu(false)}
          onLeave={() => {
            setShowInGameMenu(false);
            setCurrentSitePage('home');
          }}
          onResetCharacter={handleResetCharacter}
          playerName={playerName}
          roomCode={roomCode}
          peerCount={peerCount}
          currentMap={currentMap}
          onSelectMap={handleSelectMap}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isShiftLock={isShiftLock}
          onToggleShiftLock={handleToggleShiftLock}
          screenScaleMode={screenScaleMode}
          onScreenScaleModeChange={setScreenScaleMode}
          resolutionScale={resolutionScale}
          onResolutionScaleChange={setResolutionScale}
          onTriggerEvent={handleTriggerWorldEvent}
        />
      </div>
    );
  }

  // Render  Website Navigation Pages
  return (
    <div id="verlex--site-layout" className="min-h-screen bg-[#efefef] flex flex-col justify-between font-sans selection:bg-blue-300">
      {/*  Header */}
      <Header
        currentPage={currentSitePage}
        onNavigate={(page) => setCurrentSitePage(page)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isLoggedIn={isLoggedIn}
        playerName={playerName}
        onLogout={handleLogout}
        onPlayGame={() => handleLaunch3DGame('crossroads')}
        onOpenServers={() => handleOpenServerBrowser('all')}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentSitePage === 'home' && (
          <HomePage
            avatarConfig={avatarConfig}
            playerName={playerName}
            isLoggedIn={isLoggedIn}
            onLogin={handleLogin}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onLaunchGame={(mapId) => handleLaunch3DGame(mapId)}
            onJoinServer={handleJoinServer}
            onOpenServerBrowser={handleOpenServerBrowser}
            onNavigateToAvatar={() => setCurrentSitePage('my_verlex')}
            onNavigateToGames={() => setCurrentSitePage('games')}
          />
        )}

        {currentSitePage === 'games' && (
          <GamesPage 
            onLaunchGame={(mapId) => handleLaunch3DGame(mapId)} 
            onJoinServer={handleJoinServer}
            onOpenServerBrowser={handleOpenServerBrowser}
            onRemixToStudio={(remixPlace) => {
              setActiveRemixPlace(remixPlace);
              setCurrentSitePage('studio');
            }}
            onPlayRemixGame={(remixPlace) => {
              handleLaunch3DGame('studio_map', remixPlace);
            }}
            playerName={playerName}
          />
        )}

        {currentSitePage === 'my_verlex' && (
          <MyVerlexPage
            avatarConfig={avatarConfig}
            onChangeConfig={handleSaveAvatarConfig}
            playerName={playerName}
            onPlayPersonalPlace={() => handleLaunch3DGame('happy_home')}
          />
        )}

        {currentSitePage === 'catalog' && (
          <CatalogPage
            avatarConfig={avatarConfig}
            onChangeConfig={handleSaveAvatarConfig}
            onNavigateToWardrobe={() => setCurrentSitePage('my_verlex')}
          />
        )}

        {currentSitePage === 'forum' && <ForumPage playerName={playerName} />}
        {currentSitePage === 'studio' && (
          <VerlexStudioPage
            onLaunchGame={(mapId, customPlace) => {
              handleLaunch3DGame((mapId as MapTemplateId) || 'studio_map', customPlace || activeRemixPlace);
            }}
            activeRemixPlace={activeRemixPlace}
          />
        )}

        {currentSitePage === 'builders_club' && (
          <BuildersClubPage onPlayGame={() => handleLaunch3DGame('baseplate')} />
        )}

        {currentSitePage === 'filter_trainer' && (
          <FilterTrainerPage />
        )}

        {currentSitePage === 'friends' && (
          <FriendsPage
            currentName={playerName}
            onSwitchAccount={(name) => handleLogin(name)}
            onPlayGame={(mapId, roomCode) => handleLaunch3DGame(mapId, roomCode)}
            onNavigate={(page) => setCurrentSitePage(page)}
          />
        )}
      </main>

      {/*  Footer */}
      <Footer />

      {/* Server Browser Modal */}
      <ServerBrowserModal
        isOpen={showServerBrowserModal}
        onClose={() => setShowServerBrowserModal(false)}
        onJoinServer={handleJoinServer}
        selectedMapFilter={serverBrowserMapFilter}
        activeRoomCode={roomCode}
          activePeerCount={peerCount}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        currentName={playerName}
      />
    </div>
  );
}
