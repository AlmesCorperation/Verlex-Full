import { AvatarConfig, MapTemplateId } from '../types';
import { Peer, DataConnection } from 'peerjs';

export interface Friend {
  id: string;
  name: string;
  avatar: AvatarConfig;
  status: 'online' | 'in_game' | 'busy' | 'offline';
  customStatus?: string;
  currentGame?: MapTemplateId;
  currentRoomCode?: string;
  isTrusted: boolean;
  trustedCode?: string;
  addedAt: number;
  isBlocked?: boolean;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  text: string;
  timestamp: number;
  isTrusted: boolean;
  isRead: boolean;
}

export interface PrivateP2PGame {
  id: string;
  roomCode: string;
  mapId: MapTemplateId;
  name: string;
  hostName: string;
  hostId: string;
  accessType: 'friends_only' | 'trusted_only' | 'code_required';
  passCode?: string;
  maxPlayers: number;
  currentPlayers: number;
  createdAt: number;
}

export interface FriendInvite {
  id: string;
  fromFriendId: string;
  fromFriendName: string;
  roomCode: string;
  mapId: MapTemplateId;
  timestamp: number;
}

export interface ActivityItem {
  id: string;
  friendName: string;
  action: string;
  timestamp: number;
  icon?: string;
}

export interface PendingFriendRequest {
  id: string;
  fromUsername: string;
  toUsername: string;
  isTrusted?: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'verlex_friends_service_v2';
const PM_STORAGE_KEY = 'verlex_private_messages_v2';
const USER_CODE_KEY = 'verlex_my_trusted_code';
const STATUS_KEY = 'verlex_my_social_status';
const OUTGOING_REQUESTS_KEY = 'verlex_outgoing_friend_requests_v3';
const INCOMING_REQUESTS_KEY = 'verlex_incoming_friend_requests_v3';

const DEFAULT_FRIENDS: Friend[] = [];

const DEFAULT_MESSAGES: PrivateMessage[] = [];

type Listener = () => void;

class FriendsService {
  private friends: Friend[] = [];
  private messages: PrivateMessage[] = [];
  private outgoingRequests: PendingFriendRequest[] = [];
  private incomingRequests: PendingFriendRequest[] = [];
  private privateGames: PrivateP2PGame[] = [];
  private pendingInvites: FriendInvite[] = [];
  private activities: ActivityItem[] = [];
  private listeners: Set<Listener> = new Set();
  private myTrustedCode: string = '';
  private myStatus: 'online' | 'in_game' | 'busy' | 'offline' = 'online';
  private myCustomStatus: string = 'Playing VERLEX Sandbox!';
  private myUsername: string = 'Guest';

  // Social P2P
  private socialPeer: Peer | null = null;
  private socialConnections: Map<string, DataConnection> = new Map();
  private pingInterval: any;

  constructor() {
    this.loadData();
    this.setupStorageSync();
  }

  private setupStorageSync() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (
          e.key === STORAGE_KEY ||
          e.key === OUTGOING_REQUESTS_KEY ||
          e.key === INCOMING_REQUESTS_KEY ||
          e.key === PM_STORAGE_KEY
        ) {
          this.loadData();
          this.notify();
        }
      });
    }
  }

  private loadData() {
    // 1. Trusted Code
    let code = localStorage.getItem(USER_CODE_KEY);
    if (!code) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      code = `VLX-TRUST-${rand}`;
      localStorage.setItem(USER_CODE_KEY, code);
    }
    this.myTrustedCode = code;

    // 2. Status
    const savedStatus = localStorage.getItem(STATUS_KEY);
    if (savedStatus) {
      try {
        const parsed = JSON.parse(savedStatus);
        this.myStatus = parsed.status || 'online';
        this.myCustomStatus = parsed.customStatus || 'Playing VERLEX Sandbox!';
      } catch (e) {}
    }

    // 3. Friends
    const savedFriends = localStorage.getItem(STORAGE_KEY);
    if (savedFriends) {
      try {
        this.friends = JSON.parse(savedFriends);
      } catch (e) {
        this.friends = DEFAULT_FRIENDS;
      }
    } else {
      this.friends = DEFAULT_FRIENDS;
      this.saveFriends();
    }

    // 4. Pending Friend Requests
    const savedOutgoing = localStorage.getItem(OUTGOING_REQUESTS_KEY);
    if (savedOutgoing) {
      try { this.outgoingRequests = JSON.parse(savedOutgoing); } catch (e) { this.outgoingRequests = []; }
    }
    const savedIncoming = localStorage.getItem(INCOMING_REQUESTS_KEY);
    if (savedIncoming) {
      try { this.incomingRequests = JSON.parse(savedIncoming); } catch (e) { this.incomingRequests = []; }
    }

    // 5. Messages
    const savedMsgs = localStorage.getItem(PM_STORAGE_KEY);
    if (savedMsgs) {
      try {
        this.messages = JSON.parse(savedMsgs);
      } catch (e) {
        this.messages = DEFAULT_MESSAGES;
      }
    } else {
      this.messages = DEFAULT_MESSAGES;
      this.saveMessages();
    }

    // Initial activities
    this.activities = [];

    // Initial private games
    this.privateGames = [];
  }

  private saveFriends() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.friends));
    this.notify();
  }

  private saveRequests() {
    localStorage.setItem(OUTGOING_REQUESTS_KEY, JSON.stringify(this.outgoingRequests));
    localStorage.setItem(INCOMING_REQUESTS_KEY, JSON.stringify(this.incomingRequests));
    this.notify();
  }

  private saveMessages() {
    localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(this.messages));
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- Social P2P API ---
  public initSocialP2P(username: string) {
    if (this.myUsername === username && this.socialPeer) return;
    this.myUsername = username;
    
    if (this.socialPeer) {
      this.socialPeer.destroy();
      this.socialConnections.clear();
      if (this.pingInterval) clearInterval(this.pingInterval);
    }

    const peerId = `verlex-user-${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    this.socialPeer = new Peer(peerId, { debug: 0 });

    this.socialPeer.on('open', () => {
      console.log(`[Social P2P] Connected as ${peerId}`);
      this.startPingingFriends();
    });

    this.socialPeer.on('connection', (conn) => {
      this.setupSocialConnection(conn);
    });

    this.socialPeer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') {
        console.warn(`[Social P2P] ID ${peerId} taken, another tab might be open.`);
      }
    });
  }

  private startPingingFriends() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    const ping = () => {
      if (!this.socialPeer) return;

      // Ping existing friends
      this.friends.forEach((f) => {
        const friendPeerId = `verlex-user-${f.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        if (!this.socialConnections.has(friendPeerId)) {
          const conn = this.socialPeer!.connect(friendPeerId, { reliable: true });
          conn.on('open', () => {
            this.setupSocialConnection(conn);
          });
          conn.on('error', () => {});
        }
      });

      // Ping outgoing pending requests
      this.outgoingRequests.forEach((req) => {
        const friendPeerId = `verlex-user-${req.toUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        if (!this.socialConnections.has(friendPeerId)) {
          const conn = this.socialPeer!.connect(friendPeerId, { reliable: true });
          conn.on('open', () => {
            this.setupSocialConnection(conn);
          });
          conn.on('error', () => {});
        }
      });
    };
    ping();
    this.pingInterval = setInterval(ping, 10000);
  }

  private setupSocialConnection(conn: DataConnection) {
    const friendPeerId = conn.peer;
    if (this.socialConnections.has(friendPeerId)) {
      conn.close();
      return;
    }

    this.socialConnections.set(friendPeerId, conn);

    // Find the friend and mark them online
    const friendName = friendPeerId.replace('verlex-user-', '');
    let friend = this.friends.find((f) => f.name.toLowerCase().replace(/[^a-z0-9]/g, '') === friendName);

    if (friend) {
      if (friend.status === 'offline') {
        friend.status = 'online';
        this.saveFriends();
      }

      // Send our presence immediately
      conn.send({
        type: 'PRESENCE_SYNC',
        payload: {
          status: this.myStatus,
          customStatus: this.myCustomStatus,
        },
      });
    }

    // Check if we have an outgoing pending request to this connected peer
    const outgoing = this.outgoingRequests.find(
      (r) => r.toUsername.toLowerCase().replace(/[^a-z0-9]/g, '') === friendName
    );
    if (outgoing) {
      conn.send({
        type: 'FRIEND_REQUEST',
        payload: outgoing,
      });
    }

    conn.on('data', (data: any) => {
      this.handleSocialMessage(friendPeerId, data);
    });

    conn.on('close', () => {
      this.socialConnections.delete(friendPeerId);
      if (friend) {
        friend.status = 'offline';
        this.saveFriends();
      }
    });

    conn.on('error', () => {
      this.socialConnections.delete(friendPeerId);
      if (friend) {
        friend.status = 'offline';
        this.saveFriends();
      }
    });
  }

  private handleSocialMessage(friendPeerId: string, msg: any) {
    if (!msg || !msg.type) return;
    const peerUsername = friendPeerId.replace('verlex-user-', '');

    // 1. FRIEND_REQUEST
    if (msg.type === 'FRIEND_REQUEST') {
      const payload: PendingFriendRequest = msg.payload;
      if (!payload || !payload.fromUsername) return;
      if (payload.fromUsername.toLowerCase() === this.myUsername.toLowerCase()) return;

      // Check if already friends
      if (this.friends.some((f) => f.name.toLowerCase() === payload.fromUsername.toLowerCase())) {
        return;
      }

      // Check if already in incoming requests
      const exists = this.incomingRequests.some(
        (r) => r.fromUsername.toLowerCase() === payload.fromUsername.toLowerCase()
      );

      if (!exists) {
        this.incomingRequests.push({
          id: payload.id || `freq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fromUsername: payload.fromUsername,
          toUsername: this.myUsername,
          isTrusted: !!payload.isTrusted,
          timestamp: Date.now(),
        });
        this.saveRequests();
        this.addActivity(payload.fromUsername, 'sent you a Friend Request!');
      }
      return;
    }

    // 2. FRIEND_REQUEST_ACCEPT
    if (msg.type === 'FRIEND_REQUEST_ACCEPT') {
      const fromUsername = msg.payload?.fromUsername;
      if (!fromUsername) return;

      // Remove from outgoing requests
      this.outgoingRequests = this.outgoingRequests.filter(
        (r) => r.toUsername.toLowerCase() !== fromUsername.toLowerCase()
      );
      this.saveRequests();

      // Add as friend if not present
      let friend = this.friends.find((f) => f.name.toLowerCase() === fromUsername.toLowerCase());
      if (!friend) {
        friend = {
          id: `friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: fromUsername,
          avatar: {
            headColor: '#eab308',
            torsoColor: '#0284c7',
            leftArmColor: '#eab308',
            rightArmColor: '#eab308',
            leftLegColor: '#1e293b',
            rightLegColor: '#1e293b',
            face: 'smile',
            hat: 'verlex_cap',
            tshirt: 'verlex_v',
          },
          status: 'online',
          customStatus: 'Playing VERLEX Sandbox!',
          isTrusted: !!msg.payload?.isTrusted,
          trustedCode: `VLX-${Math.floor(1000 + Math.random() * 9000)}`,
          addedAt: Date.now(),
        };
        this.friends.push(friend);
        this.saveFriends();
        this.addActivity(fromUsername, 'accepted your Friend Request!');
      }
      return;
    }

    // 3. FRIEND_REQUEST_DECLINE
    if (msg.type === 'FRIEND_REQUEST_DECLINE') {
      const fromUsername = msg.payload?.fromUsername;
      if (!fromUsername) return;
      this.outgoingRequests = this.outgoingRequests.filter(
        (r) => r.toUsername.toLowerCase() !== fromUsername.toLowerCase()
      );
      this.saveRequests();
      this.addActivity(fromUsername, 'declined your Friend Request.');
      return;
    }

    const friend = this.friends.find(
      (f) => f.name.toLowerCase().replace(/[^a-z0-9]/g, '') === peerUsername
    );
    if (!friend) return;

    if (msg.type === 'PRESENCE_SYNC') {
      friend.status = msg.payload.status || 'online';
      if (msg.payload.customStatus !== undefined) {
        friend.customStatus = msg.payload.customStatus;
      }
      this.saveFriends();
    } else if (msg.type === 'PRIVATE_MESSAGE') {
      const newMsg: PrivateMessage = {
        id: `pm_${Date.now()}_${Math.random()}`,
        senderId: friend.id,
        senderName: friend.name,
        recipientId: 'my_user',
        recipientName: 'Me',
        text: msg.payload.text,
        timestamp: Date.now(),
        isTrusted: friend.isTrusted,
        isRead: false,
      };
      this.messages.push(newMsg);
      this.saveMessages();
    }
  }

  // --- Friends API ---
  public getFriends(): Friend[] {
    return this.friends;
  }

  public getMyTrustedCode(): string {
    return this.myTrustedCode;
  }

  public getMyStatus() {
    return { status: this.myStatus, customStatus: this.myCustomStatus };
  }

  public updateMyStatus(status: 'online' | 'in_game' | 'busy' | 'offline', customStatus?: string) {
    this.myStatus = status;
    if (customStatus !== undefined) this.myCustomStatus = customStatus;
    localStorage.setItem(STATUS_KEY, JSON.stringify({ status: this.myStatus, customStatus: this.myCustomStatus }));
    
    // Broadcast status to all connected friends
    this.socialConnections.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: 'PRESENCE_SYNC',
          payload: {
            status: this.myStatus,
            customStatus: this.myCustomStatus,
          }
        });
      }
    });

    this.notify();
  }

  public getIncomingRequests(): PendingFriendRequest[] {
    return this.incomingRequests;
  }

  public getOutgoingRequests(): PendingFriendRequest[] {
    return this.outgoingRequests;
  }

  public hasPendingRequestWith(username: string): 'outgoing' | 'incoming' | null {
    const clean = username.trim().toLowerCase();
    if (this.outgoingRequests.some((r) => r.toUsername.toLowerCase() === clean)) {
      return 'outgoing';
    }
    if (this.incomingRequests.some((r) => r.fromUsername.toLowerCase() === clean)) {
      return 'incoming';
    }
    return null;
  }

  public sendFriendRequest(targetName: string, isTrusted = false): { success: boolean; message: string } {
    const cleanName = targetName.trim();
    if (!cleanName) return { success: false, message: 'Please enter a valid username.' };

    if (cleanName.toLowerCase() === this.myUsername.toLowerCase()) {
      return { success: false, message: 'You cannot send a friend request to yourself.' };
    }

    const isFriend = this.friends.some((f) => f.name.toLowerCase() === cleanName.toLowerCase());
    if (isFriend) {
      return { success: false, message: `${cleanName} is already in your friends list.` };
    }

    const alreadySent = this.outgoingRequests.some((r) => r.toUsername.toLowerCase() === cleanName.toLowerCase());
    if (alreadySent) {
      return { success: false, message: `Friend request already sent to ${cleanName}.` };
    }

    // Check if there is an incoming request from them! If so, auto-accept!
    const incomingReq = this.incomingRequests.find((r) => r.fromUsername.toLowerCase() === cleanName.toLowerCase());
    if (incomingReq) {
      return this.acceptFriendRequest(incomingReq.id);
    }

    const req: PendingFriendRequest = {
      id: `freq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromUsername: this.myUsername,
      toUsername: cleanName,
      isTrusted,
      timestamp: Date.now(),
    };

    this.outgoingRequests.push(req);
    this.saveRequests();

    // Attempt to connect via P2P to send friend request
    if (this.socialPeer) {
      const friendPeerId = `verlex-user-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      let conn = this.socialConnections.get(friendPeerId);
      if (!conn) {
        conn = this.socialPeer.connect(friendPeerId, { reliable: true });
        conn.on('open', () => {
          this.setupSocialConnection(conn!);
          conn!.send({
            type: 'FRIEND_REQUEST',
            payload: req,
          });
        });
        conn.on('error', () => {});
      } else if (conn.open) {
        conn.send({
          type: 'FRIEND_REQUEST',
          payload: req,
        });
      }
    }

    this.addActivity(cleanName, 'Friend request sent over P2P.');
    return { success: true, message: `Friend request sent to ${cleanName}! Waiting for acceptance.` };
  }

  public acceptFriendRequest(requestId: string): { success: boolean; message: string } {
    const req = this.incomingRequests.find(
      (r) => r.id === requestId || r.fromUsername.toLowerCase() === requestId.toLowerCase()
    );

    if (!req) return { success: false, message: 'Friend request not found.' };

    const cleanName = req.fromUsername;

    // Remove from incoming requests
    this.incomingRequests = this.incomingRequests.filter((r) => r.id !== req.id);
    this.saveRequests();

    // Add to friends list if not present
    let friend = this.friends.find((f) => f.name.toLowerCase() === cleanName.toLowerCase());
    if (!friend) {
      friend = {
        id: `friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        avatar: {
          headColor: '#eab308',
          torsoColor: '#0284c7',
          leftArmColor: '#eab308',
          rightArmColor: '#eab308',
          leftLegColor: '#1e293b',
          rightLegColor: '#1e293b',
          face: 'smile',
          hat: 'verlex_cap',
          tshirt: 'verlex_v',
        },
        status: 'online',
        customStatus: 'Playing VERLEX Sandbox!',
        isTrusted: !!req.isTrusted,
        trustedCode: `VLX-${Math.floor(1000 + Math.random() * 9000)}`,
        addedAt: Date.now(),
      };
      this.friends.push(friend);
      this.saveFriends();
    }

    // Send P2P acceptance notification
    if (this.socialPeer) {
      const friendPeerId = `verlex-user-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      let conn = this.socialConnections.get(friendPeerId);
      if (!conn) {
        conn = this.socialPeer.connect(friendPeerId, { reliable: true });
        conn.on('open', () => {
          this.setupSocialConnection(conn!);
          conn!.send({
            type: 'FRIEND_REQUEST_ACCEPT',
            payload: { fromUsername: this.myUsername, isTrusted: !!req.isTrusted },
          });
        });
        conn.on('error', () => {});
      } else if (conn.open) {
        conn.send({
          type: 'FRIEND_REQUEST_ACCEPT',
          payload: { fromUsername: this.myUsername, isTrusted: !!req.isTrusted },
        });
      }
    }

    this.addActivity(cleanName, 'is now your friend!');
    return { success: true, message: `Accepted ${cleanName}'s friend request!` };
  }

  public declineFriendRequest(requestId: string): { success: boolean; message: string } {
    const req = this.incomingRequests.find(
      (r) => r.id === requestId || r.fromUsername.toLowerCase() === requestId.toLowerCase()
    );

    const fromName = req ? req.fromUsername : 'User';
    this.incomingRequests = this.incomingRequests.filter(
      (r) => r.id !== requestId && r.fromUsername.toLowerCase() !== requestId.toLowerCase()
    );
    this.saveRequests();

    if (req && this.socialPeer) {
      const friendPeerId = `verlex-user-${fromName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const conn = this.socialConnections.get(friendPeerId);
      if (conn && conn.open) {
        conn.send({
          type: 'FRIEND_REQUEST_DECLINE',
          payload: { fromUsername: this.myUsername },
        });
      }
    }

    return { success: true, message: `Declined friend request from ${fromName}.` };
  }

  public cancelOutgoingRequest(requestId: string) {
    this.outgoingRequests = this.outgoingRequests.filter(
      (r) => r.id !== requestId && r.toUsername.toLowerCase() !== requestId.toLowerCase()
    );
    this.saveRequests();
  }

  public addFriend(name: string, isTrusted = false, trustedCode?: string): { success: boolean; message: string; friend?: Friend } {
    const res = this.sendFriendRequest(name, isTrusted);
    return { success: res.success, message: res.message };
  }

  public addFriendByTrustedCode(code: string): { success: boolean; message: string; friend?: Friend } {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Please enter a valid Trusted Code.' };

    if (cleanCode === this.myTrustedCode) {
      return { success: false, message: 'That is your own Trusted Code!' };
    }

    // Check if code matches an existing friend
    const existing = this.friends.find((f) => f.trustedCode?.toUpperCase() === cleanCode);
    if (existing) {
      existing.isTrusted = true;
      this.saveFriends();
      this.addActivity(existing.name, 'was upgraded to a Trusted Friend via code exchange!');
      return { success: true, message: `Verified! ${existing.name} is now a Trusted Friend. Chat filter restrictions bypassed!`, friend: existing };
    }

    const friendName = `Friend_${cleanCode.replace(/[^A-Z0-9]/g, '').slice(-6)}`;
    return this.sendFriendRequest(friendName, true);
  }

  public toggleTrustedFriend(friendId: string): boolean {
    const friend = this.friends.find((f) => f.id === friendId);
    if (!friend) return false;
    friend.isTrusted = !friend.isTrusted;
    this.saveFriends();
    this.addActivity(friend.name, friend.isTrusted ? 'was marked as a Trusted Friend (Filter Free).' : 'was set to Standard Friend status.');
    return friend.isTrusted;
  }

  public unfriend(friendIdOrName: string) {
    const cleanTarget = friendIdOrName.trim().toLowerCase();
    const friend = this.friends.find(
      (f) => f.id === friendIdOrName || f.name.trim().toLowerCase() === cleanTarget
    );

    if (friend) {
      const friendPeerId = `verlex-user-${friend.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const conn = this.socialConnections.get(friendPeerId);
      if (conn) {
        conn.close();
        this.socialConnections.delete(friendPeerId);
      }
      this.addActivity(friend.name, 'was unfriended.');
      this.friends = this.friends.filter((f) => f.id !== friend.id);
    } else {
      this.friends = this.friends.filter(
        (f) => f.id !== friendIdOrName && f.name.trim().toLowerCase() !== cleanTarget
      );
    }
    this.saveFriends();
    this.notify();
  }

  public removeFriend(friendId: string) {
    this.unfriend(friendId);
  }

  public isTrustedFriend(friendNameOrId: string): boolean {
    const friend = this.friends.find((f) => f.id === friendNameOrId || f.name.toLowerCase() === friendNameOrId.toLowerCase());
    return friend ? friend.isTrusted : false;
  }

  // --- Private Messaging API ---
  public getMessagesWith(friendId: string): PrivateMessage[] {
    return this.messages.filter(
      (m) => (m.senderId === 'my_user' && m.recipientId === friendId) || (m.senderId === friendId && m.recipientId === 'my_user')
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  public sendPrivateMessage(friendId: string, text: string): PrivateMessage {
    const friend = this.friends.find((f) => f.id === friendId);
    const friendName = friend ? friend.name : 'Friend';
    const isTrusted = friend ? friend.isTrusted : false;

    const newMsg: PrivateMessage = {
      id: `pm_${Date.now()}_${Math.random()}`,
      senderId: 'my_user',
      senderName: 'Me',
      recipientId: friendId,
      recipientName: friendName,
      text: text,
      timestamp: Date.now(),
      isTrusted: isTrusted,
      isRead: true,
    };

    this.messages.push(newMsg);
    this.saveMessages();
    
    // Send over P2P if connected
    if (friend) {
      const friendPeerId = `verlex-user-${friend.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const conn = this.socialConnections.get(friendPeerId);
      if (conn && conn.open) {
        conn.send({
          type: 'PRIVATE_MESSAGE',
          payload: { text }
        });
      }
    }

    return newMsg;
  }

  public markMessagesRead(friendId: string) {
    let changed = false;
    this.messages.forEach((m) => {
      if (m.senderId === friendId && !m.isRead) {
        m.isRead = true;
        changed = true;
      }
    });
    if (changed) this.saveMessages();
  }

  public getUnreadCount(): number {
    return this.messages.filter((m) => m.recipientId === 'my_user' && !m.isRead).length;
  }

  // --- Private P2P Games API ---
  public getPrivateGames(): PrivateP2PGame[] {
    return this.privateGames;
  }

  public createPrivateP2PGame(
    mapId: MapTemplateId,
    name: string,
    accessType: 'friends_only' | 'trusted_only' | 'code_required',
    passCode?: string
  ): PrivateP2PGame {
    const codePrefixes: Record<MapTemplateId, string> = {
      crossroads: 'CR',
      physics_lab: 'CC',
      happy_home: 'HH',
      baseplate: 'BP',
      obby: 'OB',
      studio_map: 'ST',
    };
    const prefix = codePrefixes[mapId] || 'PRIV';
    const roomCode = `${prefix}-PRIV-${Math.floor(1000 + Math.random() * 9000)}`;

    const newGame: PrivateP2PGame = {
      id: `priv_game_${Date.now()}`,
      roomCode: roomCode,
      mapId: mapId,
      name: name || `Private ${mapId.toUpperCase()} Room`,
      hostName: 'Me (Host)',
      hostId: 'my_user',
      accessType: accessType,
      passCode: passCode,
      maxPlayers: 10,
      currentPlayers: 1,
      createdAt: Date.now(),
    };

    this.privateGames.unshift(newGame);
    this.addActivity('Me', `created private P2P server "${newGame.name}" [${roomCode}]`);
    this.notify();
    return newGame;
  }

  public sendGameInvite(friendId: string, roomCode: string, mapId: MapTemplateId) {
    const friend = this.friends.find((f) => f.id === friendId);
    if (!friend) return;

    const invite: FriendInvite = {
      id: `invite_${Date.now()}`,
      fromFriendId: 'my_user',
      fromFriendName: 'Me',
      roomCode: roomCode,
      mapId: mapId,
      timestamp: Date.now(),
    };

    this.pendingInvites.push(invite);

    // Send PM invite as well
    this.sendPrivateMessage(
      friendId,
      `🎮 PRIVATE GAME INVITE: Hey! Join me in my private game server [${roomCode}] on ${mapId.toUpperCase()}!`
    );
  }

  // --- Activity Log ---
  public getActivities(): ActivityItem[] {
    return this.activities;
  }

  private addActivity(friendName: string, action: string, icon = '✨') {
    this.activities.unshift({
      id: `act_${Date.now()}_${Math.random()}`,
      friendName,
      action,
      timestamp: Date.now(),
      icon,
    });
    if (this.activities.length > 25) this.activities.pop();
    this.notify();
  }
}

export const friendsService = new FriendsService();
