db = db.getSiblingDB('admin')

// Prüfe ob der Admin-Benutzer bereits existiert
if (!db.getUser("huegelfest_admin")) {
  db.createUser({
    user: 'huegelfest_admin',
    pwd: 'huegelfest_admin_password',
    roles: [
      {
        role: 'root',
        db: 'admin'
      }
    ]
  })
}

db = db.getSiblingDB('huegelfest')

// Prüfe ob der Anwendungsbenutzer bereits existiert
if (!db.getUser("huegelfest_user")) {
  db.createUser({
    user: 'huegelfest_user',
    pwd: 'huegelfest_password',
    roles: [
      {
        role: 'readWrite',
        db: 'huegelfest'
      }
    ]
  })
} 