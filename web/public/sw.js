// Service Worker mit vollständigem Offline-Support für Hügelfest PWA
console.log('[SW] Service Worker lädt...');

const CACHE_NAME = 'huegelfest-static-v1';
const API_CACHE_NAME = 'huegelfest-data-v1'; // Umbenannt für Server Actions

// Statische Assets die gecached werden sollen
const STATIC_ASSETS = [
  '/',
  '/android-chrome-192x192.png',
  '/logo.jpg',
  '/manifest.json'
];

// Hilfsfunktionen
const isStaticAsset = (pathname) => {
  return pathname.startsWith('/_next/static/') ||
         /\.(png|jpg|jpeg|webp|svg|ico|css|js|woff2|woff|ttf)$/.test(pathname);
};

// Server Actions erkennen (POST mit Next-Action Header)
const isServerAction = (request) => {
  return request.method === 'POST' && 
         request.headers.get('next-action') !== null;
};

// Navigation/Page Requests
const isNavigation = (request) => {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
};

// Installation: Cache initial befüllen
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.error('[SW] Cache initial fill failed:', error);
        });
      }),
      caches.open(API_CACHE_NAME) // Server Actions Cache
    ]).then(() => {
      console.log('[SW] Installation complete - Static & Data caches ready');
      self.skipWaiting();
    })
  );
});

// Aktivierung: Alte Caches aufräumen
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, API_CACHE_NAME].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Message-Handler für UpdateService Integration
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_CACHE') {
    console.log('[SW] Cache clearing requested by UpdateService');
    Promise.all([
      caches.delete(CACHE_NAME),
      caches.delete(API_CACHE_NAME)
    ]).then(() => {
      event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' });
    });
  }
  
  if (event.data?.type === 'CLEAR_DATA_CACHE') {
    console.log('[SW] Data cache clearing requested');
    caches.delete(API_CACHE_NAME).then(() => {
      event.ports[0]?.postMessage({ type: 'DATA_CACHE_CLEARED' });
    });
  }
});

// Hauptfetch-Handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. Statische Assets: Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. Server Actions: Cache für Offline-Fallback
  if (isServerAction(event.request)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        // Cache-Key basierend auf URL + Action-Name
        const actionName = event.request.headers.get('next-action');
        const cacheKey = `${url.pathname}?action=${actionName}`;
        
        try {
          // Immer erst das Netzwerk versuchen (Server Actions sind meist nicht wiederholbar)
          const response = await fetch(event.request.clone());
          
          if (response.ok) {
            // Nur erfolgreiche GET-ähnliche Server Actions cachen (fetchTimeline, etc.)
            if (actionName && (
              actionName.includes('fetch') || 
              actionName.includes('get') || 
              actionName.includes('getAllAnnouncements')
            )) {
              console.log('[SW] Caching Server Action response:', actionName);
              cache.put(cacheKey, response.clone());
            }
          }
          return response;
        } catch (error) {
          console.log('[SW] Server Action offline, checking cache:', actionName);
          
          // Offline: Versuch aus Cache zu laden
          const cachedResponse = await cache.match(cacheKey);
          if (cachedResponse) {
            console.log('[SW] Serving cached Server Action:', actionName);
            return cachedResponse;
          }
          
          // Kein Cache: Offline-Fallback für wichtige Actions
          if (actionName && (
            actionName.includes('fetchTimeline') || 
            actionName.includes('getAllAnnouncements')
          )) {
            return new Response(JSON.stringify({
              offline: true,
              message: 'Offline - Nutze lokale Daten (localStorage/SWR)',
              data: null
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          throw error;
        }
      })
    );
    return;
  }

  // 3. Navigation: Network First mit Offline-Fallback
  if (isNavigation(event.request)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Offline: Cached Root-Route zurückgeben
        return caches.match('/').then((cached) => {
          if (cached) return cached;
          
          // Fallback: Offline-Page
          return new Response(`
            <!DOCTYPE html>
            <html>
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
                  p { margin: 1rem 0; opacity: 0.9; }
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
                  }
                  .status { 
                    background: rgba(255, 153, 0, 0.1); 
                    border: 1px solid rgba(255, 153, 0, 0.3); 
                    border-radius: 8px; 
                    padding: 15px; 
                    margin: 20px 0; 
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>🎪 Hügelfest</h1>
                  <div class="status">
                    <p><strong>Offline-Modus</strong></p>
                    <p>Deine Favoriten und Timeline-Daten sind lokal gespeichert und verfügbar.</p>
                    <p>Server Actions werden über lokale Caches bereitgestellt.</p>
                  </div>
                  <button onclick="location.reload()">↻ Erneut versuchen</button>
                </div>
                <script>
                  // Auto-Reconnect wenn Online
                  window.addEventListener('online', () => {
                    setTimeout(() => location.reload(), 1000);
                  });
                </script>
              </body>
            </html>
          `, { 
            headers: { 'Content-Type': 'text/html' },
            status: 200
          });
        });
      })
    );
    return;
  }
  
  // 4. Alles andere: Network Only
});

// Push Notifications (unverändert)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/android-chrome-192x192.png',
        data: { url: data.url || '/' }
      })
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

console.log('[SW] Service Worker ready - Server Actions & Static Assets cached'); 