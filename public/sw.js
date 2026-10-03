// Service Worker for Device & Mobile System Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle user clicking the notification in their smartphone notification bar / lockscreen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window tab is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a fresh window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle push events if triggered from server
self.addEventListener('push', (event) => {
  let data = { title: 'Pemberitahuan Sistem', message: 'Ada pembaruan baru untuk Anda.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    if (event.data) {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data,
    tag: data.tag || 'vesper-system-notif',
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
