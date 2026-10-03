import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { GoogleUser } from './authService';

// The owner identifier
const OWNER_EMAIL = 'jullyan382@gmail.com';

/**
 * Checks if the user is the app owner
 */
export function isOwnerUser(user?: { email?: string | null } | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase().trim() === OWNER_EMAIL.toLowerCase().trim();
}

/**
 * Strips or masks the owner email string so it is NEVER rendered in the UI
 */
export function maskEmailIfOwner(email?: string | null): string {
  if (!email) return '';
  if (email.toLowerCase().trim() === OWNER_EMAIL.toLowerCase().trim()) {
    return 'Administrator';
  }
  return email;
}

export interface ManagedUser {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: number;
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: number;
  totalPrompts?: number;
}

export interface UserAiUsageRecord {
  id: string;
  userId: string;
  prompt: string;
  model: string;
  sessionTitle?: string;
  timestamp: number;
}

export interface BroadcastNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'update' | 'warning' | 'urgent';
  createdAt: number;
  createdBy?: string;
  active: boolean;
}

const LOCAL_USERS_KEY = 'ais_vibe_registered_users_registry_v1';
const LOCAL_NOTIF_KEY = 'ais_vibe_broadcast_notifications_v1';
const LOCAL_USAGE_KEY = 'ais_vibe_user_usage_history_v1';

/**
 * Register or update active user profile in Firestore and local registry
 */
export async function registerOrUpdateUserInCatalog(user: GoogleUser) {
  if (!user || !user.id) return;
  const isOwner = isOwnerUser(user);

  const userData: ManagedUser = {
    userId: user.id,
    email: user.email,
    displayName: user.name || (isOwner ? 'Owner' : user.email.split('@')[0]),
    avatarUrl: user.avatar || '',
    updatedAt: new Date().toISOString(),
    lastActiveAt: Date.now(),
  };

  // Sync to local registry
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const registry: Record<string, ManagedUser> = raw ? JSON.parse(raw) : {};
    const existing = registry[user.id] || {};
    registry[user.id] = {
      ...existing,
      ...userData,
      totalPrompts: existing.totalPrompts || 0,
      isBlocked: existing.isBlocked || false,
    };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(registry));
  } catch {}

  // Sync to Firestore
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      {
        ...userData,
        // Do not overwrite isBlocked if already set
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Sync user to firestore notice:', err);
  }
}

/**
 * Listen to all users in real-time for Owner Panel
 */
export function listenAllUsers(callback: (users: ManagedUser[]) => void): () => void {
  let unsubscribeFirestore = () => {};

  try {
    const usersCol = collection(db, 'users');
    unsubscribeFirestore = onSnapshot(
      usersCol,
      (snapshot) => {
        const firestoreUsers: ManagedUser[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as ManagedUser;
          firestoreUsers.push({
            ...data,
            userId: d.id,
          });
        });

        // Merge with local fallback
        const merged = mergeWithLocalUsers(firestoreUsers);
        callback(merged);
      },
      (error) => {
        console.warn('Firestore users listener fallback to local:', error);
        callback(getLocalUsers());
      }
    );
  } catch {
    callback(getLocalUsers());
  }

  return () => {
    unsubscribeFirestore();
  };
}

function getLocalUsers(): ManagedUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return Object.values(obj);
    }
  } catch {}
  return [];
}

function mergeWithLocalUsers(firestoreUsers: ManagedUser[]): ManagedUser[] {
  const local = getLocalUsers();
  const map = new Map<string, ManagedUser>();

  for (const u of local) {
    map.set(u.userId, u);
  }
  for (const u of firestoreUsers) {
    const existing = map.get(u.userId) || {};
    map.set(u.userId, { ...existing, ...u });
  }

  return Array.from(map.values()).sort(
    (a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0)
  );
}

/**
 * Toggle block status for a specific user
 */
export async function setUserBlockStatus(
  userId: string,
  isBlocked: boolean,
  reason: string = 'Akses ditangguhkan oleh administrator sistem'
): Promise<void> {
  // Update local registry
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const registry: Record<string, ManagedUser> = raw ? JSON.parse(raw) : {};
    if (registry[userId]) {
      registry[userId].isBlocked = isBlocked;
      registry[userId].blockedReason = isBlocked ? reason : undefined;
      registry[userId].blockedAt = isBlocked ? Date.now() : undefined;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(registry));
    }
  } catch {}

  // Update Firestore
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBlocked,
      blockedReason: isBlocked ? reason : null,
      blockedAt: isBlocked ? Date.now() : null,
    });
  } catch (err) {
    console.warn('Block user firestore notice:', err);
  }
}

/**
 * Listen to block status for current user
 */
export function listenUserBlockStatus(
  userId: string,
  callback: (isBlocked: boolean, reason?: string) => void
): () => void {
  // Initial local check
  const localUsers = getLocalUsers();
  const matched = localUsers.find((u) => u.userId === userId);
  if (matched?.isBlocked) {
    callback(true, matched.blockedReason);
  }

  try {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          callback(!!data.isBlocked, data.blockedReason || undefined);
        }
      },
      () => {
        // Fallback
        const check = getLocalUsers().find((u) => u.userId === userId);
        callback(!!check?.isBlocked, check?.blockedReason);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Record user AI prompt usage history
 */
export async function recordAiUsage(
  user: GoogleUser,
  prompt: string,
  model: string,
  sessionTitle: string = 'New Conversation'
) {
  if (!user || !user.id) return;
  const historyId = `usage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const record: UserAiUsageRecord = {
    id: historyId,
    userId: user.id,
    prompt: prompt.slice(0, 3000),
    model,
    sessionTitle,
    timestamp: Date.now(),
  };

  // Local storage cache
  try {
    const raw = localStorage.getItem(LOCAL_USAGE_KEY);
    const list: UserAiUsageRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(LOCAL_USAGE_KEY, JSON.stringify(list.slice(0, 200)));

    // Increment user total prompts
    const rawUsers = localStorage.getItem(LOCAL_USERS_KEY);
    if (rawUsers) {
      const uMap = JSON.parse(rawUsers);
      if (uMap[user.id]) {
        uMap[user.id].totalPrompts = (uMap[user.id].totalPrompts || 0) + 1;
        uMap[user.id].lastActiveAt = Date.now();
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(uMap));
      }
    }
  } catch {}

  // Sync to Firestore
  try {
    const subCol = doc(db, 'users', user.id, 'usage_history', historyId);
    await setDoc(subCol, record);

    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      {
        lastActiveAt: Date.now(),
      },
      { merge: true }
    );
  } catch {}
}

/**
 * Fetch AI usage history for a user
 */
export async function fetchUserAiUsage(userId: string): Promise<UserAiUsageRecord[]> {
  try {
    const subCol = collection(db, 'users', userId, 'usage_history');
    const snap = await getDocs(subCol);
    if (!snap.empty) {
      const records: UserAiUsageRecord[] = [];
      snap.forEach((d) => records.push(d.data() as UserAiUsageRecord));
      records.sort((a, b) => b.timestamp - a.timestamp);
      return records;
    }
  } catch {}

  // Fallback to local
  try {
    const raw = localStorage.getItem(LOCAL_USAGE_KEY);
    if (raw) {
      const all: UserAiUsageRecord[] = JSON.parse(raw);
      return all.filter((r) => r.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
    }
  } catch {}

  return [];
}

/**
 * Send a broadcast notification to all users
 */
export async function sendBroadcastNotification(
  title: string,
  message: string,
  type: 'info' | 'update' | 'warning' | 'urgent' = 'update'
): Promise<BroadcastNotificationItem> {
  const notifId = `broadcast-${Date.now()}`;
  const notification: BroadcastNotificationItem = {
    id: notifId,
    title: title.trim(),
    message: message.trim(),
    type,
    createdAt: Date.now(),
    createdBy: 'Owner',
    active: true,
  };

  // Local storage
  try {
    const raw = localStorage.getItem(LOCAL_NOTIF_KEY);
    const list: BroadcastNotificationItem[] = raw ? JSON.parse(raw) : [];
    list.unshift(notification);
    localStorage.setItem(LOCAL_NOTIF_KEY, JSON.stringify(list));
  } catch {}

  // Firestore sync
  try {
    const notifRef = doc(db, 'broadcast_notifications', notifId);
    await setDoc(notifRef, notification);
  } catch (err) {
    console.warn('Broadcast firestore sync notice:', err);
  }

  return notification;
}

/**
 * Delete a broadcast notification
 */
export async function deleteBroadcastNotification(notificationId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIF_KEY);
    if (raw) {
      const list: BroadcastNotificationItem[] = JSON.parse(raw);
      const filtered = list.filter((n) => n.id !== notificationId);
      localStorage.setItem(LOCAL_NOTIF_KEY, JSON.stringify(filtered));
    }
  } catch {}

  try {
    const notifRef = doc(db, 'broadcast_notifications', notificationId);
    await deleteDoc(notifRef);
  } catch {}
}

/**
 * Listen for live broadcast notifications
 */
export function listenBroadcastNotifications(
  callback: (notifications: BroadcastNotificationItem[]) => void
): () => void {
  // Read local immediately
  const getLocal = (): BroadcastNotificationItem[] => {
    try {
      const raw = localStorage.getItem(LOCAL_NOTIF_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  };

  let unsubscribeFirestore = () => {};

  try {
    const colRef = collection(db, 'broadcast_notifications');
    unsubscribeFirestore = onSnapshot(
      colRef,
      (snap) => {
        const list: BroadcastNotificationItem[] = [];
        snap.forEach((d) => {
          const item = d.data() as BroadcastNotificationItem;
          if (item.active !== false) {
            list.push({ ...item, id: d.id });
          }
        });

        // Merge with local
        const local = getLocal();
        const map = new Map<string, BroadcastNotificationItem>();
        for (const l of local) {
          if (l.active !== false) map.set(l.id, l);
        }
        for (const f of list) {
          map.set(f.id, f);
        }

        const sorted = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        callback(sorted);
      },
      () => {
        callback(getLocal());
      }
    );
  } catch {
    callback(getLocal());
  }

  return () => {
    unsubscribeFirestore();
  };
}
