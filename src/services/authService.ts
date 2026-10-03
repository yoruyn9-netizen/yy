export interface GoogleUser {
  email: string;
  name: string;
  avatar: string;
  id: string;
  loggedInAt: number;
  apiKey?: string;
  apiProvider?: 'default' | 'custom';
}

const AUTH_STORAGE_KEY = 'ais_vibe_google_user_v1';

export function getStoredUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) return parsed;
    }
  } catch {}
  return null;
}

export function saveUser(user: GoogleUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function clearUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}
