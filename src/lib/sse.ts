// Speichere alle aktiven SSE-Verbindungen
const clients = new Set<ReadableStreamDefaultController>();

// Funktion zum Senden von Updates an alle verbundenen Clients
export function sendUpdateToAllClients() {
  console.log(`Sende Update an ${clients.size} Clients`);
  
  const message = JSON.stringify({ type: 'update' });
  const deadClients = new Set<ReadableStreamDefaultController>();

  clients.forEach(client => {
    try {
      client.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
      console.log('Update erfolgreich gesendet');
    } catch (error) {
      console.error('Fehler beim Senden des Updates:', error);
      deadClients.add(client);
    }
  });

  // Entferne tote Clients
  deadClients.forEach(client => {
    clients.delete(client);
    console.log('Toter Client entfernt');
  });
}

// Funktion zum Hinzufügen eines neuen Clients
export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
  console.log(`Neuer Client hinzugefügt. Aktive Clients: ${clients.size}`);
}

// Funktion zum Entfernen eines Clients
export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
  console.log(`Client entfernt. Verbleibende Clients: ${clients.size}`);
} 