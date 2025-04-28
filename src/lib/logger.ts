export function logServerStart() {
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

export function logError(error: Error) {
  console.error('❌ Fehler:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
} 