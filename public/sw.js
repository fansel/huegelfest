// Service Worker für Push-Benachrichtigungen
console.log('Service Worker wird geladen...');

const CACHE_NAME = 'huegelfest-cache-v1';

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

// Installations-Event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation gestartet');
  event.waitUntil(self.skipWaiting());
});

// Aktivierungs-Event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Aktivierung gestartet');
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Alter Cache wird gelöscht:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch-Event
self.addEventListener('fetch', (event) => {
  // Nur GET-Anfragen behandeln
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // API-Anfragen und andere spezielle Pfade nicht cachen
  if (url.pathname.startsWith('/api/') || 
      url.pathname === '/sw.js' || 
      url.pathname === '/manifest') {
    // SSE-Verbindungen durchlassen
    if (url.pathname === '/api/updates') {
      return;
    }
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Bei erfolgreicher Anfrage: Online-Status setzen
        notifyClients(true);
        return response;
      })
      .catch(error => {
        console.error('Fetch-Fehler:', error);
        // Bei einem Fehler: Offline-Status setzen
        notifyClients(false);
        // Offline-Seite anzeigen
        return new Response(
          `<!DOCTYPE html>
          <html lang="de">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Hügelfest</title>
              <link rel="stylesheet" href="/_next/static/css/app.css">
              <link rel="stylesheet" href="/_next/static/css/globals.css">
              <link rel="stylesheet" href="/_next/static/css/tailwind.css">
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Ghost Mono', monospace;
                  background-color: #460b6c;
                  color: #ff9900;
                  min-height: 100vh;
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                }
                @font-face {
                  font-family: 'Ghost Mono';
                  src: url('/_next/static/media/GhostMono-Regular.woff2') format('woff2');
                  font-weight: normal;
                  font-style: normal;
                  font-display: swap;
                }
                .container {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: 1rem;
                  text-align: center;
                  transform: translateY(0);
                  transition: transform 0.3s ease;
                }
                .offline-message {
                  background-color: rgba(255, 153, 0, 0.1);
                  border: 1px solid #ff9900;
                  border-radius: 0.5rem;
                  padding: 1rem;
                  margin-bottom: 1rem;
                }
                .pull-indicator {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 60px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background-color: rgba(70, 11, 108, 0.9);
                  transform: translateY(-100%);
                  transition: transform 0.3s ease;
                }
                .pull-indicator.visible {
                  transform: translateY(0);
                }
                .spinner {
                  width: 24px;
                  height: 24px;
                  border: 3px solid #ff9900;
                  border-top-color: transparent;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                }
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              </style>
            </head>
            <body>
              <div class="pull-indicator">
                <div class="spinner"></div>
              </div>
              <div class="container">
                <div class="offline-message">
                  <h2>Du bist offline</h2>
                  <p>Wischen zum Aktualisieren</p>
                </div>
              </div>
              <script>
                let startY = 0;
                let currentY = 0;
                const container = document.querySelector('.container');
                const pullIndicator = document.querySelector('.pull-indicator');
                const threshold = 100;

                document.addEventListener('touchstart', (e) => {
                  startY = e.touches[0].clientY;
                });

                document.addEventListener('touchmove', (e) => {
                  currentY = e.touches[0].clientY;
                  const diff = currentY - startY;

                  if (diff > 0 && window.scrollY === 0) {
                    e.preventDefault();
                    const pullDistance = Math.min(diff, threshold);
                    container.style.transform = \`translateY(\${pullDistance}px)\`;
                    
                    if (pullDistance > threshold * 0.8) {
                      pullIndicator.classList.add('visible');
                    } else {
                      pullIndicator.classList.remove('visible');
                    }
                  }
                });

                document.addEventListener('touchend', () => {
                  if (currentY - startY > threshold * 0.8) {
                    // Aktualisiere die Seite
                    window.location.reload();
                  } else {
                    // Zurück zur Ausgangsposition
                    container.style.transform = 'translateY(0)';
                    pullIndicator.classList.remove('visible');
                  }
                });
              </script>
            </body>
          </html>`,
          {
            headers: { 
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache'
            }
          }
        );
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