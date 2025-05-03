db = db.getSiblingDB('huegelfest');

db.createUser({
  user: process.env.MONGO_USERNAME,
  pwd: process.env.MONGO_PASSWORD,
  roles: [
    {
      role: "readWrite",
      db: "huegelfest"
    }
  ]
}); 