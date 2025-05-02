import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Funktion zum Lesen des Git-Stands einer Datei
function getGitFileContent(filePath: string): string {
  try {
    return execSync(`git show HEAD~1:${filePath}`).toString();
  } catch (error) {
    return '';
  }
}

// Funktion zum Lesen der aktuellen Datei
function getCurrentFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return '';
  }
}

// Funktion zum Vergleichen der Dateien
function compareFiles(gitContent: string, currentContent: string): {
  added: string[];
  removed: string[];
  modified: string[];
} {
  const gitLines = gitContent.split('\n');
  const currentLines = currentContent.split('\n');

  const added = currentLines.filter(line => !gitLines.includes(line));
  const removed = gitLines.filter(line => !currentLines.includes(line));
  const modified = currentLines.filter((line, index) => 
    gitLines[index] !== line && !added.includes(line) && !removed.includes(line)
  );

  return { added, removed, modified };
}

// Funktion zum Rekursiven Durchsuchen von Verzeichnissen
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

// Hauptfunktion
async function compareComponents() {
  // Alte Komponenten
  const oldComponentsDir = 'src/components';
  const oldFiles = getAllFiles(oldComponentsDir);

  // Neue Komponenten
  const newComponentsDir = 'src/client/components';
  const newFiles = getAllFiles(newComponentsDir);

  console.log('Vergleiche Komponenten...\n');

  // Vergleiche alte Komponenten
  console.log('=== Alte Komponenten ===');
  for (const file of oldFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const gitContent = getGitFileContent(relativePath);
    const currentContent = getCurrentFileContent(file);

    if (gitContent) {
      const { added, removed, modified } = compareFiles(gitContent, currentContent);
      
      console.log(`\n=== ${relativePath} ===`);
      if (added.length > 0) {
        console.log('\nHinzugefügt:');
        added.forEach(line => console.log(`+ ${line}`));
      }
      if (removed.length > 0) {
        console.log('\nEntfernt:');
        removed.forEach(line => console.log(`- ${line}`));
      }
      if (modified.length > 0) {
        console.log('\nModifiziert:');
        modified.forEach(line => console.log(`~ ${line}`));
      }
    }
  }

  // Vergleiche neue Komponenten
  console.log('\n=== Neue Komponenten ===');
  for (const file of newFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const gitContent = getGitFileContent(relativePath);
    const currentContent = getCurrentFileContent(file);

    if (gitContent) {
      const { added, removed, modified } = compareFiles(gitContent, currentContent);
      
      console.log(`\n=== ${relativePath} ===`);
      if (added.length > 0) {
        console.log('\nHinzugefügt:');
        added.forEach(line => console.log(`+ ${line}`));
      }
      if (removed.length > 0) {
        console.log('\nEntfernt:');
        removed.forEach(line => console.log(`- ${line}`));
      }
      if (modified.length > 0) {
        console.log('\nModifiziert:');
        modified.forEach(line => console.log(`~ ${line}`));
      }
    } else {
      console.log(`\n=== ${relativePath} (NEU) ===`);
    }
  }
}

compareComponents().catch(console.error); 