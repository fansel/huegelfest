const DEBUG = false;

// Service Worker für App-Updates und statische Assets - SWR macht das Daten-Caching
if (DEBUG) {
  console.log('Service Worker wird geladen...');
}

// Dynamische Cache-Versionierung - wird bei Build-Zeit ersetzt
const CACHE_VERSION = 'v0.1.0';
const BUILD_ID = Date.now().toString(); // Dynamische Build-ID
const CACHE_NAME = `huegelfest-cache-${CACHE_VERSION}-${BUILD_ID}`;

const APP_SHELL = [
  '/',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/logo.jpg',
  '/manifest.json'
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
         /\.(png|jpg|jpeg|webp|svg|ico|css|js|woff2|woff|ttf|eot)$/.test(pathname);
};

// Hilfsfunktion: Verbesserte Cache-Matching-Logik
const matchCachedPage = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  
  // Versuch 1: Exakter Match
  let response = await cache.match(request);
  if (response) return response;
  
  // Versuch 2: URL ohne Query-Parameter
  const url = new URL(request.url);
  const cleanUrl = url.origin + url.pathname;
  response = await cache.match(cleanUrl);
  if (response) return response;
  
  // Versuch 3: Root-Seite für SPA-Navigation
  if (url.pathname !== '/') {
    response = await cache.match('/');
    if (response) return response;
  }
  
  return null;
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
      if (DEBUG) {
        console.log('[SW] Alte Caches nach App-Update gelöscht');
      }
    });
  }
  if (event.data && event.data.type === 'DEBUG_CACHE') {
    // Debug-Funktion für Cache-Inhalt
    caches.keys().then(async (cacheNames) => {
      const cacheInfo = {};
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        cacheInfo[cacheName] = requests.map(req => ({
          url: req.url,
          method: req.method
        }));
      }
      event.ports[0]?.postMessage({ type: 'CACHE_DEBUG', data: cacheInfo });
    });
  }
});

// Installations-Event: App Shell und Assets cachen
self.addEventListener('install', (event) => {
  console.log('[SW] Installation gestartet für', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching App Shell...');
      
      // App Shell Items einzeln cachen mit verbesserter Fehlerbehandlung
      const cachePromises = APP_SHELL.map(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            cache: 'no-cache' // Frische Version holen
          });
          
          if (!response.ok) {
            throw new Error(`Request for ${url} failed with status ${response.status}`);
          }
          
          // Für HTML-Seiten (insbesondere '/') neue Response mit passenden Headern erstellen
          if (url === '/' || response.headers.get('content-type')?.includes('text/html')) {
            const responseClone = response.clone();
            const body = await responseClone.text();
            const newResponse = new Response(body, {
              status: response.status,
              statusText: response.statusText,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
            await cache.put(url, newResponse);
          } else {
            await cache.put(url, response);
          }
          
          console.log('[SW] ✅ Cached:', url);
        } catch (err) {
          console.warn('[SW] ⚠️ Failed to cache', url, err);
        }
      });
      
      await Promise.all(cachePromises);
    }).then(() => {
      console.log('[SW] ✅ Installation abgeschlossen');
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
  console.log('[SW] Aktivierung gestartet für', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('huegelfest-cache-') && cacheName !== CACHE_NAME) {
            console.log('[SW] 🗑️ Alter Cache wird gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] ✅ Aktivierung abgeschlossen');
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

// Fetch-Event: Verbesserte Offline-Unterstützung
self.addEventListener('fetch', (event) => {
  // Nur GET-Anfragen behandeln
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Statische Assets: Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          if (DEBUG) {
            console.log('[SW] 📦 Serving cached asset:', url.pathname);
          }
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
              if (DEBUG) {
                console.log('[SW] 💾 Cached new asset:', url.pathname);
              }
            }
            return response;
          });
        }).catch(() => {
          if (DEBUG) {
            console.warn('[SW] ❌ Asset fetch failed:', url.pathname);
          }
          return new Response('Asset not available offline', { status: 404 });
        });
      })
    );
    return;
  }

  // App Shell für Navigation (Offline-Fallback mit verbessertem Caching)
  if (event.request.mode === 'navigate') {
    if (DEBUG) {
      console.log('[SW] 🧭 Navigation request:', url.pathname);
    }
    event.respondWith(
      fetch(event.request).then(async (response) => {
        // Bei erfolgreichem Netzwerk-Request: Response cachen und zurückgeben
        if (DEBUG) {
          console.log('[SW] ✅ Navigation successful:', url.pathname);
        }
        
        // Für wichtige Seiten: Auch im Cache speichern für Offline-Zugriff
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          try {
            const cache = await caches.open(CACHE_NAME);
            const responseClone = response.clone();
            const body = await responseClone.text();
            const cachedResponse = new Response(body, {
              status: response.status,
              statusText: response.statusText,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
            
            // Spezielle Seiten auch cachen (nicht nur Root)
            if (url.pathname === '/' || url.pathname === '/events' || url.pathname === '/sponsors') {
              cache.put(url.pathname, cachedResponse.clone());
              if (DEBUG) {
                console.log('[SW] 💾 Cached navigation page:', url.pathname);
              }
            }
          } catch (err) {
            if (DEBUG) {
              console.warn('[SW] Failed to cache navigation page:', err);
            }
          }
        }
        
        return response;
      }).catch(async () => {
        // Bei Netzwerk-Fehler: Versuche gecachte Seite zu finden
        if (DEBUG) {
          console.log('[SW] 🔄 Network failed, trying cached pages...');
        }
        
        const cachedResponse = await matchCachedPage(event.request);
        if (cachedResponse) {
          if (DEBUG) {
            console.log('[SW] 📱 Serving cached page for:', url.pathname);
          }
          return cachedResponse;
        }
        
        if (DEBUG) {
          console.log('[SW] ❌ No cached page available, showing offline page');
        }
        return new Response(`
          <!DOCTYPE html>
          <html lang="de">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Hügelfest - Offline</title>
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: linear-gradient(135deg, #460b6c, #2a0845); 
                  color: #ff9900; 
                  min-height: 100vh; 
                  margin: 0;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                }
                .container { max-width: 400px; }
                h1 { font-size: 2.5rem; margin-bottom: 1rem; }
                p { margin: 1rem 0; opacity: 0.9; line-height: 1.5; }
                button { 
                  background: #ff9900; 
                  color: #460b6c; 
                  border: none; 
                  padding: 12px 24px; 
                  border-radius: 8px; 
                  font-size: 1rem; 
                  font-weight: bold; 
                  cursor: pointer; 
                  margin: 10px;
                  transition: opacity 0.2s;
                }
                button:hover { opacity: 0.8; }
                .debug { 
                  margin-top: 20px; 
                  font-size: 0.8rem; 
                  opacity: 0.6; 
                  font-family: monospace; 
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🎪 Hügelfest</h1>
                <p>Du bist offline. Die App versucht automatisch, eine gecachte Version zu laden.</p>
                <button onclick="location.reload()">↻ Erneut versuchen</button>
                <button onclick="goHome()">🏠 Zur Startseite</button>
                <div class="debug">
                  <p>Angeforderte Seite: ${url.pathname}</p>
                  <p>Fallback-Modus: Offline-Seite</p>
                </div>
              </div>
              <script>
                function goHome() {
                  window.location.href = '/';
                }
                
                window.addEventListener('online', () => {
                  console.log('[Offline Page] Online detected, reloading...');
                  setTimeout(() => window.location.reload(), 1000);
                });
                
                // Versuche bei Load nochmal eine gecachte Version zu finden
                document.addEventListener('DOMContentLoaded', () => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                      registration.active?.postMessage({
                        type: 'DEBUG_CACHE'
                      });
                    });
                  }
                });
              </script>
            </body>
          </html>
        `, { 
          headers: { 'Content-Type': 'text/html' },
          status: 200
        });
      })
    );
    return;
  }

  // Service Worker und Manifest nicht cachen
  if (
    url.pathname === '/sw.js' ||
    url.pathname === '/manifest.json'
  ) {
    return;
  }

  // Alle anderen Requests: Network Only (SWR macht das Caching)
  // Kein Cache-Eingriff für API-Calls oder Seiten-Requests
});

// Push-Event
self.addEventListener('push', function(event) {
  console.log('[SW] Push-Ereignis empfangen:', event);
  
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
      console.error('[SW] Fehler beim Verarbeiten der Push-Nachricht:', error);
    }
  }
});

// Notification-Click-Event
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Benachrichtigung geklickt:', event.notification);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
      .catch(error => {
        console.error('[SW] Fehler beim Öffnen des Fensters:', error);
      })
  );
});

// Service Worker ready message
if (DEBUG) {
  console.log('[SW] Service Worker ready - Fokus: App-Updates und statische Assets, SWR macht Daten-Caching');
}
