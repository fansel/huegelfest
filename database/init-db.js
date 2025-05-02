const { MongoClient } = require('mongodb');
const { SHA256 } = require('crypto-js');

async function initializeDatabase() {
    const rootUri = `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@mongodb:27017`;
    const client = new MongoClient(rootUri);

    try {
        await client.connect();
        console.log('Verbunden mit MongoDB...');

        const db = client.db(process.env.MONGO_DB_NAME);

        // Prüfe ob die Benutzer bereits existieren
        const users = await db.command({ usersInfo: 1 });
        const existingUsers = users.users.map(user => user.user);

        // Erstelle Admin-Benutzer nur wenn er nicht existiert
        if (!existingUsers.includes(process.env.HUEGEL_ADMIN_USERNAME)) {
            await db.command({
                createUser: process.env.HUEGEL_ADMIN_USERNAME,
                pwd: process.env.HUEGEL_ADMIN_PASSWORD,
                roles: [
                    { role: 'dbOwner', db: process.env.MONGO_DB_NAME },
                    { role: 'readWrite', db: process.env.MONGO_DB_NAME }
                ]
            });
            console.log('Admin-Benutzer erstellt');
        } else {
            console.log('Admin-Benutzer existiert bereits');
        }

        // Erstelle normalen Benutzer nur wenn er nicht existiert
        if (!existingUsers.includes(process.env.HUEGEL_USER_USERNAME)) {
            await db.command({
                createUser: process.env.HUEGEL_USER_USERNAME,
                pwd: process.env.HUEGEL_USER_PASSWORD,
                roles: [
                    { role: 'readWrite', db: process.env.MONGO_DB_NAME }
                ]
            });
            console.log('Benutzer erstellt');
        } else {
            console.log('Benutzer existiert bereits');
        }

        // Erstelle die Users Collection und den Admin-Benutzer
        const usersCollection = db.collection('users');
        const hashedPassword = SHA256('huegelfest').toString();
        
        // Prüfe ob der Admin-Benutzer bereits existiert
        const existingAdmin = await usersCollection.findOne({ username: 'admin' });
        if (!existingAdmin) {
            await usersCollection.insertOne({
                username: 'admin',
                password: hashedPassword,
                isAdmin: true,
                createdAt: new Date(),
                lastLogin: null
            });
            console.log('Admin-Benutzer in der Anwendung erstellt');
        } else {
            console.log('Admin-Benutzer in der Anwendung existiert bereits');
        }

        // Erstelle eine Test-Collection um sicherzustellen, dass die DB existiert
        await db.createCollection('test');
        await db.collection('test').insertOne({ test: 'initialization' });
        await db.collection('test').drop();
        console.log('Datenbank initialisiert');

    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        throw error;
    } finally {
        await client.close();
        console.log('Verbindung geschlossen');
    }
}

initializeDatabase().catch(console.error);