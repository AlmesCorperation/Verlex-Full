export interface RegisteredPlayer {
  id: string;
  username: string;
  password?: string;
  registeredIndex: number;
  registeredAt: string;
  isUnlimitedVBucks: boolean;
  status: 'online' | 'offline' | 'in_game';
  currentGame?: string;
  avatarHat?: string;
}

const STORAGE_KEY = 'verlex_registered_players_v5';

const INITIAL_REGISTERED_PLAYERS: RegisteredPlayer[] = [];

type RegistryListener = () => void;

class PlayerRegistryService {
  private players: RegisteredPlayer[] = [];
  private listeners: RegistryListener[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.players = JSON.parse(saved);
      } else {
        this.players = INITIAL_REGISTERED_PLAYERS;
        this.saveToStorage();
      }
    } catch (e) {
      this.players = INITIAL_REGISTERED_PLAYERS;
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.players));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save registered players', e);
    }
  }

  public subscribe(listener: RegistryListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }

  public getAllPlayersNewestToOldest(): RegisteredPlayer[] {
    return [...this.players].sort((a, b) => b.registeredIndex - a.registeredIndex);
  }

  public authenticateOrRegister(
    username: string,
    passwordInput: string
  ): { success: boolean; message?: string; player?: RegisteredPlayer } {
    const cleanName = username.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanName || cleanName.toLowerCase().includes('testingaccount')) {
      return { success: false, message: 'Please enter a valid Character Name. "TestingAccount" is restricted.' };
    }

    if (!cleanPass && !cleanName.toLowerCase().startsWith('guest')) {
      return { success: false, message: 'Please enter a password for your account.' };
    }

    const existing = this.players.find(
      (p) => p.username.toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      // Account exists, check password if set
      if (existing.password && existing.password !== cleanPass && !cleanName.toLowerCase().startsWith('guest')) {
        return {
          success: false,
          message: `❌ Incorrect password for account "${existing.username}". Passwords must match!`,
        };
      }
      // Store password if it wasn't saved before
      if (!existing.password && cleanPass) {
        existing.password = cleanPass;
      }

      existing.status = 'online';
      this.saveToStorage();
      return { success: true, player: existing };
    }

    // Create new account
    const nextIndex =
      this.players.length > 0
        ? Math.max(...this.players.map((p) => p.registeredIndex)) + 1
        : 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newPlayer: RegisteredPlayer = {
      id: `user_${Date.now()}`,
      username: cleanName,
      password: cleanPass || 'guest_pass',
      registeredIndex: nextIndex,
      registeredAt: nowStr,
      isUnlimitedVBucks: false,
      status: 'online',
      currentGame: 'Crossroads',
      avatarHat: 'verlex_cap',
    };

    this.players.push(newPlayer);
    this.saveToStorage();
    return { success: true, player: newPlayer };
  }

  public registerPlayer(username: string): RegisteredPlayer {
    const res = this.authenticateOrRegister(username, 'password123');
    return res.player || INITIAL_REGISTERED_PLAYERS[0];
  }

  public isTestingAccount(username: string): boolean {
    return username.trim().toLowerCase() === 'testingaccount';
  }
}

export const playerRegistryService = new PlayerRegistryService();


