import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './firebase';
import { Session, ProjectState, ProjectSnapshot } from '../types';

export function getUserSessionsStorageKey(userId: string): string {
  return `ais_vibe_sessions_user_${userId}_v1`;
}

export function getUserActiveSessionKey(userId: string): string {
  return `ais_vibe_active_session_${userId}_v1`;
}

/**
 * Sanitizes a session object to ensure all fields are valid JSON / Firestore primitives
 */
function sanitizeSessionForFirestore(session: Session, userId: string): Record<string, any> {
  return {
    id: session.id,
    userId,
    title: session.title || 'Prompt Baru',
    createdAt: session.createdAt || Date.now(),
    updatedAt: session.updatedAt || Date.now(),
    systemInstruction: session.systemInstruction || '',
    messages: (session.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content || '',
      timestamp: m.timestamp || Date.now(),
      modelUsed: m.modelUsed || null,
      isCoding: Boolean(m.isCoding),
      thinkingSteps: (m.thinkingSteps || []).map((t) => ({
        id: t.id,
        action: t.action,
        target: t.target || null,
        detail: t.detail,
        timestamp: t.timestamp,
        status: t.status || 'completed',
      })),
      modifiedFiles: m.modifiedFiles || [],
      projectFiles: m.projectFiles || null,
      researchReport: m.researchReport || null,
      generatedImageUrl: m.generatedImageUrl || null,
      generatedImagePrompt: m.generatedImagePrompt || null,
      liked: Boolean(m.liked),
      disliked: Boolean(m.disliked),
    })),
    projectState: session.projectState
      ? {
          title: session.projectState.title || 'Vibe App',
          activeFilePath: session.projectState.activeFilePath || 'index.html',
          files: session.projectState.files || {},
        }
      : null,
    snapshots: (session.snapshots || []).map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      description: s.description || '',
      files: s.files || {},
    })),
  };
}

/**
 * Saves a single session to Firestore and local storage for the specified user
 */
export async function saveSessionToFirestore(userId: string, session: Session): Promise<void> {
  if (!userId || !session || !session.id) return;

  // 1. Immediately persist to user-scoped local storage
  try {
    const key = getUserSessionsStorageKey(userId);
    const raw = localStorage.getItem(key);
    const localList: Session[] = raw ? JSON.parse(raw) : [];
    const idx = localList.findIndex((s) => s.id === session.id);
    if (idx !== -1) {
      localList[idx] = session;
    } else {
      localList.unshift(session);
    }
    localStorage.setItem(key, JSON.stringify(localList));
  } catch (err) {
    console.warn('Local session storage save notice:', err);
  }

  // 2. Persist to Firestore subcollection /users/{userId}/sessions/{sessionId}
  try {
    await ensureFirebaseAuth();
    const sessionDocRef = doc(db, 'users', userId, 'sessions', session.id);
    const payload = sanitizeSessionForFirestore(session, userId);
    await setDoc(sessionDocRef, payload, { merge: true });
  } catch (err) {
    console.warn('Firestore session sync notice:', err);
  }
}

/**
 * Loads all persistent sessions for a user from Firestore and local storage,
 * merging them by latest updatedAt
 */
export async function loadUserSessions(
  userId: string,
  defaultInitialSession?: Session
): Promise<{ sessions: Session[]; activeSessionId: string }> {
  let loadedSessions: Session[] = [];
  const sessionMap = new Map<string, Session>();

  // 1. Load from user local storage cache first for instant rendering
  try {
    const key = getUserSessionsStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((s) => {
          if (s && s.id) sessionMap.set(s.id, s);
        });
      }
    }
  } catch {}

  // 2. Query Firestore /users/{userId}/sessions
  try {
    await ensureFirebaseAuth();
    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const q = query(sessionsCol, orderBy('updatedAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Session;
      if (data && data.id) {
        const existing = sessionMap.get(data.id);
        if (!existing || (data.updatedAt && data.updatedAt > (existing.updatedAt || 0))) {
          sessionMap.set(data.id, {
            ...data,
            id: data.id || docSnap.id,
          });
        }
      }
    });
  } catch (err) {
    console.warn('Firestore load user sessions notice (using local cache):', err);
  }

  loadedSessions = Array.from(sessionMap.values()).sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
  );

  // If user has no sessions yet, use initial session if provided
  if (loadedSessions.length === 0 && defaultInitialSession) {
    loadedSessions = [defaultInitialSession];
    saveSessionToFirestore(userId, defaultInitialSession).catch(() => {});
  }

  // Restore last active session ID
  let activeId = '';
  try {
    const savedActive = localStorage.getItem(getUserActiveSessionKey(userId));
    if (savedActive && loadedSessions.some((s) => s.id === savedActive)) {
      activeId = savedActive;
    }
  } catch {}

  if (!activeId && loadedSessions.length > 0) {
    activeId = loadedSessions[0].id;
  }

  return { sessions: loadedSessions, activeSessionId: activeId };
}

/**
 * Delete a session permanently from Firestore and local storage
 */
export async function deleteSessionFromFirestore(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) return;

  // 1. Remove from local storage
  try {
    const key = getUserSessionsStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const localList: Session[] = JSON.parse(raw);
      const filtered = localList.filter((s) => s.id !== sessionId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch {}

  // 2. Remove from Firestore
  try {
    await ensureFirebaseAuth();
    const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionDocRef);
  } catch (err) {
    console.warn('Delete session from firestore notice:', err);
  }
}

/**
 * Save user's active session choice
 */
export function saveUserActiveSessionId(userId: string, sessionId: string): void {
  try {
    localStorage.setItem(getUserActiveSessionKey(userId), sessionId);
  } catch {}
}
