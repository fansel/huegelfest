# Netzwerk-Stabilitäts-Verbesserungen

## Problem
Die Groups-Benutzerverwaltung "zitterte" in instabilen Netzwerken (Uni-WLAN, schwaches WiFi) aufgrund zu sensibler Online/Offline-Erkennung.

## Lösungen

### 1. Verbindungsstatus-Stabilisierung (`useGroupsWebSocket.ts`)

**Vorher:**
- Status-Checks alle 2 Sekunden
- Sofortige UI-Updates bei jeder Statusänderung
- Keine Debouncing/Stabilisierung

**Nachher:**
- Status-Checks alle 5 Sekunden (weniger häufig)
- 3 aufeinanderfolgende gleiche Status-Checks nötig für Änderung
- Stabilisierungsperiode von 6-15 Sekunden
- Debouncing mit 2-Sekunden-Verzögerung

### 2. Verbesserte Health Checks (`useNetworkStatus.ts`)

**Vorher:**
- Health Checks alle 30 Sekunden
- 3-Sekunden Timeout (zu kurz für langsame Netzwerke)
- Rate Limiting: 10 Sekunden minimum
- Aggressive Checks alle 10 Sekunden für 60 Sekunden

**Nachher:**
- Health Checks alle 45 Sekunden (weniger aggressiv)
- 8-Sekunden Timeout (besser für langsame Netzwerke)
- Rate Limiting: 15 Sekunden minimum
- Aggressive Checks alle 15 Sekunden für 90 Sekunden

### 3. Verbesserte UI-Anzeige (`GroupsOverviewWebSocketClient.tsx`)

**Vorher:**
- Rot/Grün Status-Indikator
- "Offline" bei Verbindungsproblemen
- Harte Farbwechsel

**Nachher:**
- Orange/Grün Status-Indikator (Orange = Stabilisierung)
- "Stabilisiert" statt "Offline" bei temporären Problemen
- Weiche 1-Sekunden Übergänge (`transition-colors duration-1000`)
- Informativere Statusmeldungen

### 4. Zentrale Konfiguration (`networkConfig.ts`)

Alle Timing-Parameter sind jetzt zentral konfigurierbar:

```typescript
export const NetworkConfig = {
  healthCheck: {
    regularInterval: 45000,    // 45s statt 30s
    minInterval: 15000,        // 15s statt 10s  
    timeout: 8000,             // 8s statt 3s
    aggressiveInterval: 15000, // 15s statt 10s
  },
  connectionStability: {
    statusCheckInterval: 5000, // 5s statt 2s
    stabilityThreshold: 3,     // 3 Checks für Stabilität
    debounceDelay: 2000,       // 2s Debounce
  }
};
```

## Auswirkungen

### ✅ Verbesserungen
- **Keine "Zitter"-Effekte** mehr in instabilen Netzwerken
- **Stabilere UI** mit weniger ablenkenden Statuswechseln
- **Bessere UX** in Uni-WLAN und schwachen WiFi-Verbindungen
- **Informativere Status-Anzeigen** ("Stabilisiert" statt "Offline")
- **Konfigurierbare Parameter** für zukünftige Anpassungen

### ⚠️ Kompromisse
- Etwas langsamere Reaktion auf echte Verbindungsausfälle (15s statt sofort)
- Längere Stabilisierungszeit bei Netzwerkwechseln (5-15s)

## Testen

### Gute Netzwerke
- Status sollte konstant "Live" mit grünem Indikator zeigen
- Weniger häufige, aber stabilere Updates

### Instabile Netzwerke
- Status zeigt "Stabilisiert" (orange) während Netzwerkproblemen
- Wechselt erst nach Stabilisierung zurück zu "Live" (grün)
- Keine rapid blinkenden Status-Änderungen mehr

### Offline-Szenarien
- Echte Offline-Zustände zeigen weiterhin "Offline" (rot)
- WebSocket-Fehler führen zu sofortigem Offline-Status 