#!/usr/bin/env node

/**
 * Build-Script für automatische Versionierung
 * Ersetzt Platzhalter in Service Worker und App-Dateien mit aktuellen Build-Informationen
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// __dirname für ES-Module rekonstruieren
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Git-Commit-Hash als Build-ID verwenden
function getGitCommitHash() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    console.log(`Git-Commit gefunden: ${hash}`);
    return hash;
  } catch (error) {
    console.warn('Git-Commit konnte nicht ermittelt werden, verwende Fallback');
    // Fallback für Development ohne Git oder bei Fehlern
    return `dev-${Date.now().toString(36)}`;
  }
}

// Build-Informationen generieren
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const buildTime = Date.now();
const buildId = getGitCommitHash(); // Git-Commit als Build-ID!
const version = packageJson.version;

console.log('Generiere Build-Versionierung...');
console.log(`Version: ${version}`);
console.log(`Build-Zeit: ${new Date(buildTime).toISOString()}`);
console.log(`Build-ID: ${buildId}`);

// 1. Service Worker aktualisieren
const swPath = path.join(__dirname, '../public/sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Platzhalter ersetzen
  swContent = swContent.replace(
    /const CACHE_VERSION = '[^']*';.*$/m,
    `const CACHE_VERSION = 'v${version}';`
  );
  swContent = swContent.replace(
    /const BUILD_ID = '[^']*';.*$/m,
    `const BUILD_ID = '${buildId}';`
  );
  
  fs.writeFileSync(swPath, swContent);
  console.log('Service Worker aktualisiert');
} else {
  console.warn('Service Worker nicht gefunden');
}

// 2. App-Version-Datei aktualisieren
const appVersionPath = path.join(__dirname, '../src/lib/config/appVersion.ts');
if (fs.existsSync(appVersionPath)) {
  let appVersionContent = fs.readFileSync(appVersionPath, 'utf8');
  
  // Version, buildTime und buildId ersetzen
  appVersionContent = appVersionContent.replace(
    /version: '[^']*'/,
    `version: '${version}'`
  );
  appVersionContent = appVersionContent.replace(
    /buildTime: '[^']*'/,
    `buildTime: '${buildTime}'`
  );
  appVersionContent = appVersionContent.replace(
    /buildId: '[^']*'/,
    `buildId: '${buildId}'`
  );
  
  fs.writeFileSync(appVersionPath, appVersionContent);
  console.log('App-Version-Datei aktualisiert');
} else {
  console.warn('App-Version-Datei nicht gefunden');
}

// 3. Manifest.json mit Build-Info erweitern (optional)
const manifestPath = path.join(__dirname, '../public/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Build-Informationen hinzufügen
  manifest.version = version;
  manifest.build_id = buildId;
  manifest.build_time = buildTime;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Manifest aktualisiert');
}

// 4. Build-Info-Datei für Debugging erstellen
const buildInfoPath = path.join(__dirname, '../public/build-info.json');
const buildInfo = {
  version,
  buildId,
  buildTime,
  buildDate: new Date(buildTime).toISOString(),
  nodeVersion: process.version,
  platform: process.platform
};

fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
console.log('Build-Info-Datei erstellt');

console.log('Build-Versionierung abgeschlossen!');
console.log(`Cache-Name wird sein: huegelfest-cache-v${version}-${buildId}`); 