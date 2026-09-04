import { MapTemplateId } from '../types';

export interface GamePass {
  id: string;
  gameId: string; // MapTemplateId or custom game id
  gameTitle: string;
  name: string;
  description: string;
  icon: string;
  priceVBucks: number;
  perkType: 'speed_coil' | 'gravity_coil' | 'golden_sword' | 'jetpack' | 'double_jump' | 'vip_tag' | 'neon_builder' | 'lava_shield';
  creatorName: string;
  isUserCreated?: boolean;
  salesCount: number;
}

export interface EconomyTransaction {
  id: string;
  type: 'daily_reward' | 'catalog_purchase' | 'gamepass_purchase' | 'gamepass_sale';
  amount: number;
  description: string;
  timestamp: number;
}

export interface UserEconomyState {
  verbucks: number;
  tix: number;
  firstPlayTimestamp: number;
  totalDaysPlayed: number;
  lastClaimDate: string; // 'YYYY-MM-DD'
  claimedAccountDays: number; // Number of account days claimed
  totalPlaytimeSeconds: number;
  ownedCatalogItems: string[];
  ownedGamePasses: string[];
  createdGamePasses: GamePass[];
  transactions: EconomyTransaction[];
  lastTixAwardTimestamp?: number;
}

const STORAGE_KEY = 'verlex_economy_state_v3';

// Default built-in game passes for official places
export const PREMADE_GAME_PASSES: GamePass[] = [
  {
    id: 'gp_crossroads_speed',
    gameId: 'crossroads',
    gameTitle: 'Crossroads',
    name: 'Speed Coil Pass',
    description: 'Permanent 50% movement speed boost in Crossroads brick battles!',
    icon: '⚡',
    priceVBucks: 100,
    perkType: 'speed_coil',
    creatorName: 'Verlex',
    salesCount: 142,
  },
  {
    id: 'gp_crossroads_gravity',
    gameId: 'crossroads',
    gameTitle: 'Crossroads',
    name: 'Gravity Coil Pass',
    description: 'High-altitude float jump for jumping across castle towers!',
    icon: '🌀',
    priceVBucks: 150,
    perkType: 'gravity_coil',
    creatorName: 'Verlex',
    salesCount: 98,
  },
  {
    id: 'gp_crossroads_golden',
    gameId: 'crossroads',
    gameTitle: 'Crossroads',
    name: 'VIP Golden Sword Pass',
    description: 'Unlocks the legendary Golden Sword with 50% bonus slashing power & VIP tag!',
    icon: '⚔️',
    priceVBucks: 200,
    perkType: 'golden_sword',
    creatorName: 'Verlex',
    salesCount: 215,
  },
  {
    id: 'gp_physics_jetpack',
    gameId: 'physics_lab',
    gameTitle: 'Chaos Canyon',
    name: 'Super Jetpack Pass',
    description: 'Unlimited rocket thrust to fly over Chaos Canyon suspension bridges!',
    icon: '🚀',
    priceVBucks: 200,
    perkType: 'jetpack',
    creatorName: 'Telamon',
    salesCount: 88,
  },
  {
    id: 'gp_physics_cannon',
    gameId: 'physics_lab',
    gameTitle: 'Chaos Canyon',
    name: 'Chaos Cannon Pass',
    description: 'Rapid-fire heavy explosive cannon with knockback waves!',
    icon: '💥',
    priceVBucks: 150,
    perkType: 'neon_builder',
    creatorName: 'Telamon',
    salesCount: 76,
  },
  {
    id: 'gp_obby_doublejump',
    gameId: 'obby',
    gameTitle: 'Verlex Obstacle Course IV',
    name: 'High Jump Boots Pass',
    description: 'Unlocks mid-air double jumping to clear difficult obby gaps easily!',
    icon: '👟',
    priceVBucks: 120,
    perkType: 'double_jump',
    creatorName: 'Clockwork',
    salesCount: 310,
  },
  {
    id: 'gp_obby_shield',
    gameId: 'obby',
    gameTitle: 'Verlex Obstacle Course IV',
    name: 'Lava Protection Shield Pass',
    description: 'Become immune to instant death when touching red lava bricks!',
    icon: '🛡️',
    priceVBucks: 100,
    perkType: 'lava_shield',
    creatorName: 'Clockwork',
    salesCount: 205,
  },
  {
    id: 'gp_baseplate_neon',
    gameId: 'baseplate',
    gameTitle: 'Baseplate Builder Sandbox',
    name: 'Master Builder Neon Toolset Pass',
    description: 'Unlocks glowing neon building blocks and speed conveyor tools!',
    icon: '🏗️',
    priceVBucks: 100,
    perkType: 'neon_builder',
    creatorName: 'Builderman',
    salesCount: 164,
  },
];

type EconomyListener = () => void;

class EconomyService {
  private state: UserEconomyState;
  private listeners: Set<EconomyListener> = new Set();
  private playtimeInterval: any = null;

  constructor() {
    this.state = this.loadState();
    this.checkDayIncrementAndAutoReward();
    this.startPlaytimeTracker();
  }

  private loadState(): UserEconomyState {
    const todayStr = this.getTodayString();
    const defaultState: UserEconomyState = {
      verbucks: 0, // Starts at 0 V$ as requested!
      tix: 10,
      firstPlayTimestamp: Date.now(),
      totalDaysPlayed: 1,
      lastClaimDate: '',
      claimedAccountDays: 0,
      totalPlaytimeSeconds: 0,
      ownedCatalogItems: ['verlex_cap', 'smile', 'verlex_r'], // Default starter items
      ownedGamePasses: [],
      createdGamePasses: [],
      transactions: [],
      lastTixAwardTimestamp: Date.now(),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.lastTixAwardTimestamp) {
          parsed.lastTixAwardTimestamp = Date.now();
        }
        const state: UserEconomyState = {
          ...defaultState,
          ...parsed,
        };

        // Migration: initialize claimedAccountDays based on account age & legacy claim state
        if (typeof state.claimedAccountDays !== 'number') {
          const ageMs = Math.max(0, Date.now() - (state.firstPlayTimestamp || Date.now()));
          const daysUnlocked = Math.max(1, Math.floor(ageMs / 86400000) + 1);
          if (state.lastClaimDate === todayStr) {
            state.claimedAccountDays = daysUnlocked;
          } else {
            state.claimedAccountDays = Math.max(0, daysUnlocked - 1);
          }
        }

        return state;
      }
    } catch (e) {
      console.error('Failed to load economy state', e);
    }

    return defaultState;
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save economy state', e);
    }
    this.notify();
  }

  public subscribe(listener: EconomyListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Check if a new day has arrived and calculate days played based on account age
  private checkDayIncrementAndAutoReward() {
    const daysSinceFirst = this.getAccountAgeDays();

    if (daysSinceFirst > this.state.totalDaysPlayed) {
      this.state.totalDaysPlayed = daysSinceFirst;
      this.saveState();
    }
  }

  private startPlaytimeTracker() {
    if (this.playtimeInterval) clearInterval(this.playtimeInterval);
    this.playtimeInterval = setInterval(() => {
      this.state.totalPlaytimeSeconds += 1;
      
      const now = Date.now();
      const msSinceLastTix = now - (this.state.lastTixAwardTimestamp || now);
      
      // Award 10 TIX every hour (3,600,000 ms)
      if (msSinceLastTix >= 3600000) {
        const hoursPassed = Math.floor(msSinceLastTix / 3600000);
        const tixEarned = hoursPassed * 10;
        
        this.state.tix += tixEarned;
        this.state.lastTixAwardTimestamp = this.state.lastTixAwardTimestamp! + (hoursPassed * 3600000);
        
        this.state.transactions.unshift({
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'daily_reward',
          amount: tixEarned,
          description: `Hourly TIX Stipend (+${tixEarned} TIX)`,
          timestamp: Date.now(),
        });
      }

      // Every 1 hour of active playing (or day calculation), save progress (save every 30 seconds to be safe)
      if (this.state.totalPlaytimeSeconds % 30 === 0) {
        this.saveState();
      }
    }, 1000);
  }

  // --- GETTERS ---

  public getVerbucks(): number {
    return this.state.verbucks;
  }

  public spendVerbucks(amount: number): boolean {
    if (this.state.verbucks < amount) return false;
    this.state.verbucks -= amount;
    this.saveState();
    return true;
  }

  public addOwnedItem(itemId: string) {
    if (!this.state.ownedCatalogItems.includes(itemId)) {
      this.state.ownedCatalogItems.push(itemId);
      this.saveState();
    }
  }

  public deductVerbucks(amount: number): boolean {
    if (this.state.verbucks < amount) return false;
    this.state.verbucks -= amount;
    this.saveState();
    return true;
  }

  public getTix(): number {
    return this.state.tix;
  }

  public getTotalDaysPlayed(): number {
    return this.getAccountAgeDays();
  }

  public getTotalPlaytimeSeconds(): number {
    return this.state.totalPlaytimeSeconds;
  }

  public getFormattedPlaytime(): string {
    const hrs = Math.floor(this.state.totalPlaytimeSeconds / 3600);
    const mins = Math.floor((this.state.totalPlaytimeSeconds % 3600) / 60);
    const secs = this.state.totalPlaytimeSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  }

  // --- ACCOUNT TIME HELPERS ---

  public getAccountAgeMs(): number {
    return Math.max(0, Date.now() - (this.state.firstPlayTimestamp || Date.now()));
  }

  public getAccountAgeDays(): number {
    return Math.max(1, Math.floor(this.getAccountAgeMs() / (24 * 60 * 60 * 1000)) + 1);
  }

  public getFormattedAccountAge(): string {
    const ms = this.getAccountAgeMs();
    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hrs = totalHours % 24;
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hrs}h`;
    }
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  }

  public getUnclaimedAccountDays(): number {
    const unlocked = this.getAccountAgeDays();
    const claimed = this.state.claimedAccountDays || 0;
    return Math.max(0, unlocked - claimed);
  }

  public getUnclaimedAllowanceAmount(): number {
    return this.getUnclaimedAccountDays() * 100;
  }

  public getNextAllowanceCountdown(): string {
    const ageMs = this.getAccountAgeMs();
    const currentDayUnlocked = this.getAccountAgeDays();
    const nextUnlockTargetMs = currentDayUnlocked * 24 * 60 * 60 * 1000;
    const remainingMs = Math.max(0, nextUnlockTargetMs - ageMs);

    const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  public canClaimDailyAllowance(): boolean {
    return this.getUnclaimedAccountDays() > 0;
  }

  public getOwnedCatalogItems(): string[] {
    return this.state.ownedCatalogItems;
  }

  public getOwnedGamePasses(): string[] {
    return this.state.ownedGamePasses;
  }

  public getCreatedGamePasses(): GamePass[] {
    return this.state.createdGamePasses;
  }

  public getAllGamePassesForGame(gameId: string): GamePass[] {
    const premade = PREMADE_GAME_PASSES.filter((gp) => gp.gameId === gameId);
    const userCreated = this.state.createdGamePasses.filter((gp) => gp.gameId === gameId);
    return [...premade, ...userCreated];
  }

  public getTransactions(): EconomyTransaction[] {
    return this.state.transactions;
  }

  // --- ACTIONS ---

  /**
   * Claim Allowance based on total Account Time (100 V$ per 24 hours of total account age)
   */
  public claimDailyAllowance(): { success: boolean; amount: number; message: string } {
    const unclaimedDays = this.getUnclaimedAccountDays();
    if (unclaimedDays <= 0) {
      return {
        success: false,
        amount: 0,
        message: `No unclaimed allowance right now! Total Account Time: ${this.getFormattedAccountAge()}. Next +100 V$ unlocks in ${this.getNextAllowanceCountdown()}.`,
      };
    }

    const currentDayUnlocked = this.getAccountAgeDays();
    const rewardAmount = unclaimedDays * 100;

    this.state.verbucks += rewardAmount;
    this.state.claimedAccountDays = currentDayUnlocked;
    this.state.lastClaimDate = this.getTodayString();

    this.state.transactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'daily_reward',
      amount: rewardAmount,
      description: `Account Time Allowance (+${rewardAmount} V$ for ${unclaimedDays} account day(s))`,
      timestamp: Date.now(),
    });

    this.saveState();

    return {
      success: true,
      amount: rewardAmount,
      message: `🎉 Success! Claimed +${rewardAmount} V$ based on total account time (${unclaimedDays} account day(s) claimed)! Total Balance: ${this.state.verbucks} V$`,
    };
  }

  /**
   * Purchase a Catalog item using V$ or TIX
   */
  public buyCatalogItem(itemId: string, name: string, price: number, priceType: 'V$' | 'TIX' | 'FREE' | 'R$'): { success: boolean; message: string } {
    if (this.state.ownedCatalogItems.includes(itemId)) {
      return { success: true, message: 'Item is already in your wardrobe inventory!' };
    }

    if (priceType === 'FREE' || price === 0) {
      this.state.ownedCatalogItems.push(itemId);
      this.saveState();
      return { success: true, message: `Successfully acquired ${name} for FREE!` };
    }

    // Treat legacy R$ as V$
    if (priceType === 'V$' || priceType === 'R$') {
      const currentBalance = this.getVerbucks();
      if (currentBalance < price) {
        return {
          success: false,
          message: `Not enough V$! You need ${price} V$, but only have ${currentBalance} V$. Play for more days (+100 V$/day) or create game passes to earn more!`,
        };
      }

      this.state.verbucks -= price;
      this.state.ownedCatalogItems.push(itemId);

      this.state.transactions.unshift({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'catalog_purchase',
        amount: -price,
        description: `Purchased Catalog Item: "${name}"`,
        timestamp: Date.now(),
      });

      this.saveState();
      return { success: true, message: `Successfully bought "${name}" for ${price} V$!` };
    }

    if (priceType === 'TIX') {
      if (this.state.tix < price) {
        return {
          success: false,
          message: `Not enough Tickets! You need ${price} TIX, but only have ${this.state.tix} TIX.`,
        };
      }

      this.state.tix -= price;
      this.state.ownedCatalogItems.push(itemId);

      this.state.transactions.unshift({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'catalog_purchase',
        amount: -price,
        description: `Purchased Catalog Item: "${name}" (TIX)`,
        timestamp: Date.now(),
      });

      this.saveState();
      return { success: true, message: `Successfully bought "${name}" for ${price} TIX!` };
    }

    return { success: false, message: 'Invalid price type.' };
  }

  /**
   * Buy a Game Pass using V$
   */
  public buyGamePass(gamePass: GamePass): { success: boolean; message: string } {
    if (this.state.ownedGamePasses.includes(gamePass.id)) {
      return { success: true, message: `You already own the "${gamePass.name}" Game Pass!` };
    }

    const currentBalance = this.getVerbucks();
    if (currentBalance < gamePass.priceVBucks) {
      return {
        success: false,
        message: `Not enough V$! The "${gamePass.name}" Game Pass costs ${gamePass.priceVBucks} V$, but you only have ${currentBalance} V$. Earn 100 V$ per day by playing!`,
      };
    }

    this.state.verbucks -= gamePass.priceVBucks;
    this.state.ownedGamePasses.push(gamePass.id);

    this.state.transactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'gamepass_purchase',
      amount: -gamePass.priceVBucks,
      description: `Bought Game Pass "${gamePass.name}" for ${gamePass.gameTitle}`,
      timestamp: Date.now(),
    });

    this.saveState();
    return { success: true, message: `🎉 Purchased Game Pass "${gamePass.name}"! Perks are now unlocked in ${gamePass.gameTitle}.` };
  }

  /**
   * Convert 10 TIX to 1 V$
   */
  public convertTixToVerbucks(): { success: boolean; message: string } {
    if (this.state.tix < 10) {
      return {
        success: false,
        message: `Not enough TIX! You need at least 10 TIX to convert to V$. You have ${this.state.tix} TIX.`,
      };
    }
    
    const amountToConvert = Math.floor(this.state.tix / 10) * 10;
    const vBucksEarned = amountToConvert / 10;
    
    this.state.tix -= amountToConvert;
    this.state.verbucks += vBucksEarned;
    
    this.state.transactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'daily_reward',
      amount: vBucksEarned,
      description: `Converted ${amountToConvert} TIX to ${vBucksEarned} V$`,
      timestamp: Date.now(),
    });
    
    this.saveState();
    return {
      success: true,
      message: `Successfully converted ${amountToConvert} TIX into ${vBucksEarned} V$!`,
    };
  }

  /**
   * Create a user Game Pass for monetization in your own games!
   */
  public createGamePass(
    gameId: string,
    gameTitle: string,
    name: string,
    description: string,
    icon: string,
    priceVBucks: number,
    perkType: GamePass['perkType'],
    creatorName: string
  ): GamePass {
    const newPass: GamePass = {
      id: `user_gp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      gameId,
      gameTitle,
      name,
      description,
      icon,
      priceVBucks,
      perkType,
      creatorName,
      isUserCreated: true,
      salesCount: 0,
    };

    this.state.createdGamePasses.push(newPass);

    // Auto-own pass you created yourself!
    if (!this.state.ownedGamePasses.includes(newPass.id)) {
      this.state.ownedGamePasses.push(newPass.id);
    }

    this.saveState();
    return newPass;
  }

  /**
   * Earn V$ from a Game Pass sale (e.g., when another player or visitor purchases your game pass)
   */
  public recordGamePassSale(passId: string, buyerName: string) {
    const pass = this.state.createdGamePasses.find((p) => p.id === passId);
    if (!pass) return;

    pass.salesCount += 1;
    this.state.verbucks += pass.priceVBucks;

    this.state.transactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'gamepass_sale',
      amount: pass.priceVBucks,
      description: `Sale: ${buyerName} bought your Game Pass "${pass.name}" (+${pass.priceVBucks} V$)`,
      timestamp: Date.now(),
    });

    this.saveState();
  }

  /**
   * Check if user owns a specific Game Pass
   */
  public ownsGamePass(passId: string): boolean {
    return this.state.ownedGamePasses.includes(passId);
  }

  /**
   * Check if user owns a specific Game Pass perk in a game
   */
  public hasGamePassPerk(gameId: string, perkType: GamePass['perkType']): boolean {
    const allPasses = [...PREMADE_GAME_PASSES, ...this.state.createdGamePasses];
    const matchingPasses = allPasses.filter((gp) => gp.gameId === gameId && gp.perkType === perkType);
    return matchingPasses.some((gp) => this.state.ownedGamePasses.includes(gp.id));
  }
}

export const economyService = new EconomyService();
