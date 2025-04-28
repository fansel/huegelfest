/** @type {import('next').NextConfig} */

// Logger-Funktionen
function logServerStart() {
  console.log('\n🚀 Server startet...');
  console.log('📁 Suche nach .env Datei...');
  
  // Überprüfe VAPID-Schlüssel
  const hasVapidKeys = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
  if (hasVapidKeys) {
    console.log('✅ VAPID-Schlüssel gefunden');
  } else {
    console.log('❌ VAPID-Schlüssel fehlen');
  }
  
  // Überprüfe Admin-Passwort
  const hasAdminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (hasAdminPassword) {
    console.log('✅ Admin-Passwort gefunden');
  } else {
    console.log('❌ Admin-Passwort fehlt');
  }
  
  console.log('🌐 Server läuft auf Port 3000\n');
}

function logError(error) {
  console.error('❌ Fehler:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
}

// Logge Server-Start
logServerStart();

const nextConfig = {
  images: {
    domains: ['i1.sndcdn.com', 'i2.sndcdn.com', 'i3.sndcdn.com', 'i4.sndcdn.com', 'i.scdn.co'],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  devIndicators: {
    position: 'top-left',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  onError: (err) => {
    logError(err);
  },
}

module.exports = nextConfig 