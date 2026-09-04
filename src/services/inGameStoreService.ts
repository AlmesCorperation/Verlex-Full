/**
 * In-Game Store & GamePass Purchasing Script
 * Handles real-time purchases and status buff applications in the 3D session.
 */

import { economyService } from './economyService';
import { inGameSessionService } from './inGameSessionService';
import { sounds } from '../game/soundEngine';

export interface InGameStoreItem {
  id: string;
  name: string;
  desc: string;
  priceVerbucks: number;
  icon: string;
  buffId: string;
  durationSec: number;
  speedMultiplier?: number;
}

export const IN_GAME_STORE_ITEMS: InGameStoreItem[] = [
  {
    id: 'speed_coil',
    name: 'Speed Coil Boost',
    desc: '+100% Movement Walk & Run Speed for 60 seconds',
    priceVerbucks: 50,
    icon: '⚡',
    buffId: 'speed_boost',
    durationSec: 60,
    speedMultiplier: 2.0,
  },
  {
    id: 'gravity_coil',
    name: 'Lunar Gravity Coil',
    desc: 'Jump twice as high with half gravity for 60 seconds',
    priceVerbucks: 75,
    icon: '🌀',
    buffId: 'gravity_boost',
    durationSec: 60,
  },
  {
    id: 'super_health',
    name: 'Super Health Pack',
    desc: 'Instantly restores full 100 HP + 25 Bonus Armor',
    priceVerbucks: 30,
    icon: '❤️',
    buffId: 'health_pack',
    durationSec: 1,
  },
  {
    id: 'double_studs',
    name: 'Double Stud Multiplier',
    desc: 'Earn 2x score for every brick placed or destroyed',
    priceVerbucks: 100,
    icon: '🪙',
    buffId: 'double_studs',
    durationSec: 120,
  },
  {
    id: 'vip_nametag',
    name: 'VIP Glowing NameTag',
    desc: 'Unlocks shiny Golden VIP crown and title badge',
    priceVerbucks: 150,
    icon: '👑',
    buffId: 'vip_title',
    durationSec: 300,
  },
];

class InGameStoreService {
  public purchaseItem(itemId: string, engine?: any): { success: boolean; message: string } {
    const item = IN_GAME_STORE_ITEMS.find((i) => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found in store catalog.' };

    const currentV = economyService.getVerbucks();
    if (currentV < item.priceVerbucks) {
      sounds.playOof();
      return {
        success: false,
        message: `Insufficient Verbucks! You need ${item.priceVerbucks} V$ (You have ${currentV} V$).`,
      };
    }

    // Deduct funds
    economyService.deductVerbucks(item.priceVerbucks);
    sounds.playClick();

    // Apply buff to Session Service
    inGameSessionService.applyBuff({
      id: item.buffId,
      name: item.name,
      icon: item.icon,
      duration: item.durationSec,
      multiplier: item.speedMultiplier || 1,
    });

    // Execute active effect on 3D Game Engine if provided
    if (engine) {
      if (item.id === 'super_health') {
        engine.localAvatar.updateNameTag(engine.playerName, 100, 100);
        inGameSessionService.updateHealth(100);
      } else if (item.id === 'speed_coil') {
        engine.physics.characterSpeed = 24; // boost base speed
        setTimeout(() => {
          if (engine.physics) engine.physics.characterSpeed = 12;
        }, item.durationSec * 1000);
      } else if (item.id === 'gravity_coil') {
        engine.physics.world.gravity.set(0, -9.81, 0); // half gravity
        setTimeout(() => {
          if (engine.physics) engine.physics.world.gravity.set(0, -25, 0);
        }, item.durationSec * 1000);
      } else if (item.id === 'vip_nametag') {
        engine.localAvatar.updateNameTag(`👑 VIP ${engine.playerName}`, 100, 100);
      }
    }

    return {
      success: true,
      message: `Successfully purchased ${item.name}! Perk active for ${item.durationSec}s.`,
    };
  }
}

export const inGameStoreService = new InGameStoreService();
