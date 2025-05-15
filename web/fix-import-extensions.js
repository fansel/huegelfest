import fs from 'fs';
import path from 'path';

/**
 * Rekursiv alle .js-Dateien durchsuchen und lokale relative Imports ohne Endung auf .js umschreiben.
 * Nur für Standalone-Builds gedacht!
 */
function fixImports(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Nur den Pfad im from-Statement patchen!
      content = content.replace(
        /(from\s+['"](\.{1,2}\/[^'"]+?))(['"])/g,
        (match, p1, p2, p3) => {
          // Wenn der Pfad schon auf .js endet, nichts tun
          if (p2.endsWith('.js')) return match;
          return `${p1}.js${p3}`;
        }
      );
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

// Passe ggf. den Pfad an, falls dein Standalone-Output woanders liegt
const standaloneSrc = path.join(process.cwd(), '.next', 'standalone', 'src');
if (fs.existsSync(standaloneSrc)) {
  fixImports(standaloneSrc);
  console.log('✅ Import-Endungen im Standalone-Build auf .js angepasst.');
} else {
  console.warn('⚠️  Standalone-Output nicht gefunden:', standaloneSrc);
}