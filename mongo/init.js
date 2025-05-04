function getMongoConfig() {
  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;

  if (!username || !password) {
    console.error('MongoDB Zugangsdaten sind nicht konfiguriert');
    throw new Error('MongoDB Zugangsdaten sind nicht konfiguriert');
  }

  return { username, password };
}

// Wechsle zur Anwendungsdatenbank
db = db.getSiblingDB('huegelfest');

const { username, password } = getMongoConfig();

// Erstelle den Anwendungsbenutzer
db.createUser({
  user: username,
  pwd: password,
  roles: [
    { role: 'readWrite', db: 'huegelfest' }
  ]
}); 