import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

const IMPORT_MAPPINGS = {
  // Components
  '@/components/': '@/client/components/',
  './components/': '@/client/components/',
  '../components/': '@/client/components/',
  '../../components/': '@/client/components/',
  '../../../components/': '@/client/components/',
  
  // Contexts
  '@/contexts/': '@/client/contexts/',
  './contexts/': '@/client/contexts/',
  '../contexts/': '@/client/contexts/',
  '../../contexts/': '@/client/contexts/',
  '../../../contexts/': '@/client/contexts/',
  
  // App Pages
  '../app/': '@/app/',
  '../../app/': '@/app/',
  '../../../app/': '@/app/',
  
  // Services
  '@/services/': '@/server/services/',
  './services/': '@/server/services/',
  '../services/': '@/server/services/',
  
  // Lib
  '@/lib/': '@/server/lib/',
  './lib/': '@/server/lib/',
  '../lib/': '@/server/lib/',
  
  // Types
  '@/types/': '@/types/',
  './types/': '@/types/',
  '../types/': '@/types/',
};

async function fixImports() {
  try {
    console.log('🔍 Suche nach TypeScript/TSX Dateien...');
    const files = await glob('src/**/*.{ts,tsx}', {
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    });

    console.log(`📁 ${files.length} Dateien gefunden.`);
    let fixedFiles = 0;
    let totalChanges = 0;

    for (const file of files) {
      let content = await readFile(file, 'utf-8');
      let modified = false;
      let fileChanges = 0;

      // Ersetze alle alten Pfade
      for (const [oldPath, newPath] of Object.entries(IMPORT_MAPPINGS)) {
        const regex = new RegExp(`from ['"]${oldPath}`, 'g');
        const matches = content.match(regex);
        
        if (matches) {
          content = content.replace(regex, `from '${newPath}`);
          modified = true;
          fileChanges += matches.length;
        }
      }

      if (modified) {
        await writeFile(file, content, 'utf-8');
        fixedFiles++;
        totalChanges += fileChanges;
        console.log(`✅ ${file}: ${fileChanges} Import(s) korrigiert`);
      }
    }

    console.log(`\n✨ Fertig! ${totalChanges} Imports in ${fixedFiles} Dateien korrigiert.`);
  } catch (error) {
    console.error('❌ Fehler beim Korrigieren der Imports:', error);
    process.exit(1);
  }
}

fixImports(); 