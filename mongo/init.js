// Wechsle zur Anwendungsdatenbank
db = db.getSiblingDB('huegelfest');

// Keine Authentifizierung mehr nötig, da die DB nur im Docker-Netzwerk erreichbar ist 