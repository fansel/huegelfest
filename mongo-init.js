db = db.getSiblingDB('admin')

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