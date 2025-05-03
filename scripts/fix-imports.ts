import fs from 'fs';
import path from 'path';

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixImports(content: string): string {
  // Ersetze alte Imports mit neuen
  return content
    .replace(/from ['"]@\/components\/(.*?)['"]/g, 'from \'@/client/components/$1\'')
    .replace(/from ['"]@\/contexts\/(.*?)['"]/g, 'from \'@/client/contexts/$1\'')
    .replace(/from ['"]@\/lib\/(.*?)['"]/g, 'from \'@/server/lib/$1\'')
    .replace(/from ['"]@\/types\/(.*?)['"]/g, 'from \'@/types/$1\'');
}

async function fixAllImports() {
  const srcDir = 'src';
  const files = getAllFiles(srcDir);

  console.log('Korrigiere Imports...\n');

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const fixedContent = fixImports(content);

    if (content !== fixedContent) {
      fs.writeFileSync(file, fixedContent);
      console.log(`✓ ${file}`);
    }
  }

  console.log('\nImport-Korrekturen abgeschlossen!');
}

fixAllImports().catch(console.error); 