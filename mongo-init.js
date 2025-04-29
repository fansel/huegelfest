db.auth('huegelfest_admin', 'huegelfest_admin_password')

db = db.getSiblingDB('huegelfest')

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