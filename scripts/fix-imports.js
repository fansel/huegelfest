const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mapping von alten zu neuen Pfaden
const importMappings = {
  '@/lib/admin': '@/server/actions/admin',
  '@/lib/types': '@/types/types',
  '@/lib/logger': '@/server/lib/logger',
  '@/lib/sse': '@/server/lib/sse',
  '@/lib/webpush': '@/server/lib/webpush',
  '@/lib/auth': '@/auth/auth',
  '@/lib/iconTranslations': '@/client/lib/iconTranslations',
  '@/services/': '@/server/services/',
};

// Funktion zum Ersetzen der Imports in einer Datei
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Ersetze alle Imports
  Object.entries(importMappings).forEach(([oldPath, newPath]) => {
    const regex = new RegExp(`from ['"]${oldPath}(.*?)['"]`, 'g');
    const newContent = content.replace(regex, `from '${newPath}$1'`);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  if (modified) {
    console.log(`Fixing imports in: ${filePath}`);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

// Finde alle TypeScript/JavaScript Dateien
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}');

// Verarbeite jede Datei
files.forEach(fixImportsInFile);

console.log('Import fixes completed!'); 