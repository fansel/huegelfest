// Service Worker für Push-Benachrichtigungen
console.log('Service Worker wird geladen...');

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Aktivierung');
  event.waitUntil(clients.claim());
});

// Cache für Offline-Funktionalität
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('push', function (event) {
  console.log('Push-Ereignis empfangen:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Benachrichtigung geklickt:', event.notification);
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
}) 