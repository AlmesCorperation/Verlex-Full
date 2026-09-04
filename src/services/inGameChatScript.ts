/**
 * In-Game Chat Script Engine
 * Handles chat commands, slash shortcuts (/e, /help, /speed, /rejoin, /verbucks, /reset, /tp, /stats),
 * and provides retro system responses and auto-completions.
 */

import { inGameSessionService } from './inGameSessionService';
import { economyService } from './economyService';
import { sounds } from '../game/soundEngine';

export interface CommandResult {
  isCommand: boolean;
  systemResponse?: string;
  triggerEmote?: string;
  triggerReset?: boolean;
  triggerClear?: boolean;
}

class InGameChatScript {
  public parseAndExecute(text: string, engine?: any): CommandResult {
    const trimmed = text.trim();
    if (!trimmed.startsWith('/')) {
      return { isCommand: false };
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg1 = parts[1]?.toLowerCase();

    // 1. Emotes: /e dance, /e wave, /e cheer, /e sit, /e highfive, /e hug, /e rps, /e duodance, /e carry
    if (cmd === 'e' || cmd === 'emote') {
      if (!arg1) {
        return {
          isCommand: true,
          systemResponse: 'Emotes: /e sit, /e dance, /e wave, /e cheer, /e highfive, /e hug, /e rps, /e duodance, /e carry',
        };
      }
      return {
        isCommand: true,
        triggerEmote: arg1,
      };
    }

    // 2. Help: /help or /commands
    if (cmd === 'help' || cmd === 'commands' || cmd === '?') {
      return {
        isCommand: true,
        systemResponse: 'Commands: /e [emote], /reset, /stats, /verbucks, /tp, /clear, /speed [10-30], /store',
      };
    }

    // 3. Reset / Die: /reset, /die, /oof
    if (cmd === 'reset' || cmd === 'die' || cmd === 'oof') {
      return {
        isCommand: true,
        triggerReset: true,
      };
    }

    // 4. Clear chat log: /clear
    if (cmd === 'clear' || cmd === 'cls') {
      return {
        isCommand: true,
        triggerClear: true,
      };
    }

    // 5. Check Verbucks balance: /verbucks or /balance or /money
    if (cmd === 'verbucks' || cmd === 'balance' || cmd === 'money' || cmd === 'v$') {
      const v = economyService.getVerbucks();
      const t = economyService.getTix();
      return {
        isCommand: true,
        systemResponse: `Account Balance: ${v.toLocaleString()} V$ (Verbucks) | ${t} TIX (Tickets).`,
      };
    }

    // 6. Check Player Session Stats: /stats or /score
    if (cmd === 'stats' || cmd === 'score' || cmd === 'rank') {
      const s = inGameSessionService.getStats();
      const dur = inGameSessionService.getSessionDurationString();
      return {
        isCommand: true,
        systemResponse: `Stats: ${s.rankTitle} | Score: ${s.score} | Studs: ${s.studsCollected} | Session Time: ${dur}`,
      };
    }

    // 7. Speed Boost command: /speed [num]
    if (cmd === 'speed') {
      const speedVal = parseInt(arg1) || 20;
      if (engine && engine.physics) {
        engine.physics.characterSpeed = Math.min(40, Math.max(5, speedVal));
        sounds.playClick();
      }
      return {
        isCommand: true,
        systemResponse: `Character speed set to ${Math.min(40, Math.max(5, speedVal))}.`,
      };
    }

    // 8. Teleport to Spawn: /tp or /spawn
    if (cmd === 'tp' || cmd === 'spawn') {
      if (engine && engine.physics) {
        engine.physics.characterBody.position.set(0, 10, 0);
        engine.physics.characterBody.velocity.set(0, 0, 0);
        sounds.playClick();
      }
      return {
        isCommand: true,
        systemResponse: `Teleported back to spawn origin [0, 10, 0].`,
      };
    }

    // Fallback unknown command
    return {
      isCommand: true,
      systemResponse: `Unknown command "/${cmd}". Type /help for a list of valid in-game commands.`,
    };
  }
}

export const inGameChatScript = new InGameChatScript();
