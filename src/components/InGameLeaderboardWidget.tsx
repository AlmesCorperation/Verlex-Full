import React, { useState, useEffect } from 'react';
import { Heart, Trophy, ChevronDown, ChevronUp, Shield, Crown } from 'lucide-react';
import { inGameSessionService, PlayerStats } from '../services/inGameSessionService';
import { inGameLeaderboardService, LeaderboardPlayer } from '../services/inGameLeaderboardService';

interface InGameLeaderboardWidgetProps {
  health: number;
  maxHealth: number;
  score: number;
  playerName: string;
  peerCount: number;
  roomCode: string;
}

export const InGameLeaderboardWidget: React.FC<InGameLeaderboardWidgetProps> = ({
  health,
  maxHealth,
  score,
  playerName,
  peerCount,
  roomCode,
}) => {
  const [sessionStats, setSessionStats] = useState<PlayerStats>(inGameSessionService.getStats());
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardPlayer[]>(inGameLeaderboardService.getLeaderboardList());
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    inGameLeaderboardService.setLocalPlayer('local', playerName, true);
  }, [playerName]);

  useEffect(() => {
    inGameLeaderboardService.updateLocalStats(score, sessionStats.kills, sessionStats.studsCollected);
  }, [score, sessionStats.kills, sessionStats.studsCollected]);

  useEffect(() => {
    const unsubSession = inGameSessionService.subscribe(() => {
      setSessionStats(inGameSessionService.getStats());
    });
    const unsubLeaderboard = inGameLeaderboardService.subscribe(() => {
      setLeaderboardList(inGameLeaderboardService.getLeaderboardList());
    });
    return () => {
      unsubSession();
      unsubLeaderboard();
    };
  }, []);

  return (
    <div className="absolute top-16 right-3 z-30 flex flex-col items-end gap-2 select-none">
      {/* Top-Right Healthbar Box */}
      <div className="roblox-healthbar-container">
        <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
        <div className="roblox-healthbar-track">
          <div
            className="roblox-healthbar-fill"
            style={{ width: `${Math.max(0, Math.min(100, (health / maxHealth) * 100))}%` }}
          />
        </div>
        <span className="font-mono text-xs font-bold text-white">{health} / {maxHealth}</span>
      </div>

      {/* Leaderboard Table Box */}
      <div className="roblox-leaderboard-box">
        {/* Leaderboard Titlebar Header */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="roblox-leaderboard-header cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </div>
          <button className="p-0.5 text-amber-300">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Leaderboard List Body */}
        {isExpanded && (
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {leaderboardList.map((player) => (
              <div
                key={player.id}
                className={`roblox-leaderboard-row ${player.isLocal ? 'local-player' : ''}`}
              >
                <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                  {player.buildersClub === 'obc' && (
                    <span title="Outrageous Builders Club" className="text-amber-400 text-[10px]">👑</span>
                  )}
                  {player.buildersClub === 'tbc' && (
                    <span title="Turbo Builders Club" className="text-red-400 text-[10px]">🛡️</span>
                  )}
                  {player.buildersClub === 'bc' && (
                    <span title="Builders Club" className="text-blue-400 text-[10px]">⭐</span>
                  )}
                  <span className={`font-bold ${player.isLocal ? 'text-white' : 'text-neutral-200'}`}>
                    {player.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-amber-300 font-bold">{player.score} pts</span>
                  <span className="text-neutral-400">{player.ping}ms</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
