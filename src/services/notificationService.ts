import { BroadcastNotificationItem, listenBroadcastNotifications } from './ownerService';

const NOTIFIED_BROADCAST_KEY = 'ais_vibe_device_notified_broadcast_ids_v1';

/**
 * Registers the Service Worker for mobile system notifications (Android / iOS / Desktop)
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('Service worker registration notice:', err);
    return null;
  }
}

/**
 * Requests native system notification permission from the user's smartphone / browser
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Vibrate phone to confirm permission granted
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      playCompletionChime();
    }
    return permission;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return 'denied';
  }
}

/**
 * Checks current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Plays a pleasant synthesizer chime via Web Audio API
 */
export function playCompletionChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2); // D6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // Audio autoplay policy fallback
  }
}

export interface DeviceNotificationOptions {
  body: string;
  tag?: string;
  data?: any;
  vibrate?: number[];
  renotify?: boolean;
}

/**
 * Displays a REAL Native System Notification in the user's phone notification tray / lock screen!
 * Uses ServiceWorkerRegistration.showNotification (required on mobile phones / Android)
 * with fallback to new Notification() on desktop browsers.
 */
export async function showDeviceNotification(
  title: string,
  options: DeviceNotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Play audio chime and trigger smartphone vibration
  playCompletionChime();
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(options.vibrate || [200, 100, 200, 100, 200]);
    } catch {}
  }

  // Check if system notifications are allowed
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions = {
    body: options.body,
    tag: options.tag || 'vesper-alert',
    vibrate: options.vibrate || [200, 100, 200],
    renotify: options.renotify ?? true,
    data: options.data,
  };

  // Primary Path for Smartphone Devices (Android / iOS): Service Worker Registration
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions as any);
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker showNotification notice, falling back:', swErr);
    }
  }

  // Secondary Fallback Path: Standard Notification constructor
  try {
    const notif = new Notification(title, notificationOptions as any);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Direct Notification constructor notice:', err);
    return false;
  }
}

/**
 * Sends a native smartphone system notification when an AI generation task completes
 */
export function notifyTaskCompleted(taskTitle = 'Tugas Anda telah selesai dikerjakan') {
  const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  const bodyText = isHidden
    ? `Tugas "${taskTitle}" selesai diproses. Ketuk untuk membuka aplikasi.`
    : `Tugas "${taskTitle}" selesai diproses.`;

  showDeviceNotification('Vesper.ai — Tugas Selesai', {
    body: bodyText,
    tag: 'task-completed-' + Date.now(),
    vibrate: [200, 100, 200],
  }).catch(() => {});
}

/**
 * Listens to Owner broadcasts in real-time and displays a REAL smartphone system notification
 * on every client device!
 */
export function initDeviceBroadcastNotificationListener(onNotificationReceived?: (item: BroadcastNotificationItem) => void): () => void {
  // Ensure Service Worker is registered
  registerServiceWorker().catch(() => {});

  let isFirstLoad = true;

  const unsub = listenBroadcastNotifications((broadcasts) => {
    if (!broadcasts || broadcasts.length === 0) return;

    let notifiedIds: string[] = [];
    try {
      const raw = localStorage.getItem(NOTIFIED_BROADCAST_KEY);
      notifiedIds = raw ? JSON.parse(raw) : [];
    } catch {}

    // On very first mount, record existing broadcast IDs so user isn't spammed with old history
    if (isFirstLoad) {
      isFirstLoad = false;
      const allIds = broadcasts.map((b) => b.id);
      const merged = Array.from(new Set([...notifiedIds, ...allIds]));
      try {
        localStorage.setItem(NOTIFIED_BROADCAST_KEY, JSON.stringify(merged));
      } catch {}
      return;
    }

    // Identify newly pushed broadcast announcements
    const newBroadcasts = broadcasts.filter((b) => !notifiedIds.includes(b.id));

    if (newBroadcasts.length > 0) {
      newBroadcasts.forEach((item) => {
        // Trigger REAL Smartphone / OS Notification!
        showDeviceNotification(`Pemberitahuan: ${item.title}`, {
          body: item.message,
          tag: `broadcast-${item.id}`,
          vibrate: [300, 150, 300],
          data: item,
        }).catch(() => {});

        if (onNotificationReceived) {
          onNotificationReceived(item);
        }

        notifiedIds.push(item.id);
      });

      try {
        localStorage.setItem(NOTIFIED_BROADCAST_KEY, JSON.stringify(notifiedIds));
      } catch {}
    }
  });

  return unsub;
}
