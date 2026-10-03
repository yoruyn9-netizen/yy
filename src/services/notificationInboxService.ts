import { BroadcastNotificationItem } from './ownerService';

const READ_IDS_KEY = 'ais_vibe_inbox_read_ids_v2';
const DELETED_IDS_KEY = 'ais_vibe_inbox_deleted_ids_v2';

export function getInboxReadIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getInboxDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNotificationAsRead(id: string): string[] {
  const current = getInboxReadIds();
  if (!current.includes(id)) {
    const updated = [...current, id];
    try {
      localStorage.setItem(READ_IDS_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  }
  return current;
}

export function markAllNotificationsAsRead(ids: string[]): string[] {
  const current = getInboxReadIds();
  const merged = Array.from(new Set([...current, ...ids]));
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(merged));
  } catch {}
  return merged;
}

export function deleteNotificationFromInbox(id: string): string[] {
  const current = getInboxDeletedIds();
  if (!current.includes(id)) {
    const updated = [...current, id];
    try {
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  }
  return current;
}

export function clearAllNotificationsFromInbox(ids: string[]): string[] {
  const current = getInboxDeletedIds();
  const merged = Array.from(new Set([...current, ...ids]));
  try {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(merged));
  } catch {}
  return merged;
}

export function calculateUnreadCount(allBroadcasts: BroadcastNotificationItem[]): number {
  const readIds = new Set(getInboxReadIds());
  const deletedIds = new Set(getInboxDeletedIds());
  return allBroadcasts.filter((b) => !deletedIds.has(b.id) && !readIds.has(b.id)).length;
}
