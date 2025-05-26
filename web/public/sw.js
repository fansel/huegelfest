// Service Worker für App-Updates und statische Assets - SWR macht das Daten-Caching
console.log('Service Worker wird geladen...');

// Dynamische Cache-Versionierung - wird bei Build-Zeit ersetzt
const CACHE_VERSION = 'v0.1.0';
const BUILD_ID = '18b43e51174a06e4';
const CACHE_NAME = `huegelfest-cache-${CACHE_VERSION}-${BUILD_ID}`;

const APP_SHELL = [
  '/',
  '/android-chrome-192x192.png',
  '/logo.jpg',
  // ggf. weitere statische Dateien aus /public
];

// Funktion zum Benachrichtigen aller Clients über Updates
const notifyClients = (message) => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
};

// Hilfsfunktion: Prüfung ob es sich um ein statisches Asset handelt
const isStaticAsset = (pathname) => {
  return pathname.startsWith('/_next/static/') ||
         /\.(png|jpg|jpeg|webp|svg|ico|css|js|woff2|woff|ttf)$/.test(pathname);
};

// Message-Handler für Client-Kommunikation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      version: CACHE_VERSION,
      buildId: BUILD_ID,
      cacheName: CACHE_NAME
    });
  }
  if (event.data && event.data.type === 'APP_UPDATE_INVALIDATE') {
    // Bei App-Updates: Alle Caches löschen (außer aktueller)
    caches.keys().then(cacheNames => {
      const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
      return Promise.all(oldCaches.map(name => caches.delete(name)));
    }).then(() => {
      console.log('[SW] Alte Caches nach App-Update gelöscht');
    });
  }
});

// Installations-Event: App Shell und Assets cachen
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation gestartet für', CACHE_NAME);
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
    }).then(() => {
      console.log('Service Worker: Installation abgeschlossen');
      // Clients über neue Version informieren
      notifyClients({
        type: 'SW_INSTALLED',
        version: CACHE_VERSION,
        buildId: BUILD_ID
      });
      self.skipWaiting();
    })
  );
});

// Aktivierungs-Event: Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Aktivierung gestartet für', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('huegelfest-cache-') && cacheName !== CACHE_NAME) {
            console.log('Alter Cache wird gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Aktivierung abgeschlossen');
      // Clients über Aktivierung informieren
      notifyClients({
        type: 'SW_ACTIVATED',
        version: CACHE_VERSION,
        buildId: BUILD_ID
      });
      return self.clients.claim();
    })
  );
});

// Fetch-Event: Nur statische Assets cachen
self.addEventListener('fetch', (event) => {
  // Nur GET-Anfragen behandeln
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Statische Assets: Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // App Shell für Navigation (Offline-Fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || Response.error();
      })
    );
    return;
  }

  // Service Worker und Manifest nicht cachen
  if (
    url.pathname === '/sw.js' ||
    url.pathname === '/manifest'
  ) {
    return;
  }

  // Alle anderen Requests: Network Only (SWR macht das Caching)
  // Kein Cache-Eingriff für API-Calls oder Seiten-Requests
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

// Fokus: Nur App-Updates und statische Assets - SWR + WebSockets machen das Daten-Caching 