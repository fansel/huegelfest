db = db.getSiblingDB('admin');

// Erstelle den Root-Benutzer
db.createUser({
  user: 'huegeladmin',
  pwd: 'huegeladmin123',
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' }
  ]
});

// Wechsle zur Anwendungsdatenbank
db = db.getSiblingDB('huegelfest');

// Erstelle den Anwendungsbenutzer
db.createUser({
  user: 'huegeluser',
  pwd: 'huegeluser123',
  roles: [
    { role: 'readWrite', db: 'huegelfest' }
  ]
}); 