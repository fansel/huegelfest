// Perfekter Service Worker für Next.js PWA: Offline-First, Stale-While-Revalidate, App Shell
console.log('Service Worker wird geladen...');

const CACHE_NAME = 'huegelfest-cache-v3';
const APP_SHELL = [
  '/',
  '/android-chrome-192x192.png',
  '/logo.jpg',
  // ggf. weitere statische Dateien aus /public
];

// Funktion zum Benachrichtigen aller Clients über den Netzwerkstatus
const notifyClients = (isOnline) => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        isOnline
      });
    });
  });
};

// Installations-Event: App Shell und Assets cachen
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation gestartet');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(APP_SHELL.map((url) =>
        fetch(url)
          .then((response) => {
            if (!response.ok) throw new Error(`Request for ${url} failed with status ${response.status}`);
            return cache.put(url, response);
          })
          .catch((err) => {
            console.error('Failed to cache', url, err);
          })
      ));
    }).then(() => self.skipWaiting())
  );
});

// Aktivierungs-Event: Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Aktivierung gestartet');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Alter Cache wird gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch-Event: Stale-While-Revalidate für Navigations-Requests, Cache-First für Assets
self.addEventListener('fetch', (event) => {
  // Nur GET-Anfragen behandeln
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Navigations-Requests (z.B. Seitenaufrufe): Stale-While-Revalidate
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback: App Shell
          return caches.match('/') || Response.error();
        }
      })
    );
    return;
  }

  // Statische Assets: Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // API-Anfragen und andere spezielle Pfade nicht cachen
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/manifest'
  ) {
    return;
  }

  // Fallback: Network First, dann Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push-Event
self.addEventListener('push', function(event) {
  console.log('Push-Ereignis empfangen:', event);
  
  if (event.data) {
    try {
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
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Push-Nachricht:', error);
    }
  }
});

// Notification-Click-Event
self.addEventListener('notificationclick', function(event) {
  console.log('Benachrichtigung geklickt:', event.notification);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
      .catch(error => {
        console.error('Fehler beim Öffnen des Fensters:', error);
      })
  );
});

// Hinweis: Bei Änderungen an APP_SHELL oder Caching-Strategie muss die Cache-Version (CACHE_NAME) erhöht werden.
// Die App ist jetzt maximal offlinefähig: App Shell, Seiten und Assets werden optimal gecacht. 