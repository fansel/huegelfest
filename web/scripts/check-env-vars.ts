import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

interface EnvVarUsage {
  file: string;
  line: number;
  variable: string;
  context: string;
}

async function findFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...await findFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function findEnvVars(files: string[]): Promise<EnvVarUsage[]> {
  const usages: EnvVarUsage[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const matches = line.match(/process\.env\.([A-Z_]+)/g);
      if (matches) {
        matches.forEach(match => {
          const variable = match.replace('process.env.', '');
          usages.push({
            file,
            line: index + 1,
            variable,
            context: line.trim()
          });
        });
      }
    });
  }

  return usages;
}

function categorizeEnvVars(usages: EnvVarUsage[]): {
  clientSide: Set<string>;
  serverSide: Set<string>;
  usageDetails: Record<string, EnvVarUsage[]>;
} {
  const clientSide = new Set<string>();
  const serverSide = new Set<string>();
  const usageDetails: Record<string, EnvVarUsage[]> = {};

  usages.forEach(usage => {
    const { variable, file } = usage;
    
    if (!usageDetails[variable]) {
      usageDetails[variable] = [];
    }
    usageDetails[variable].push(usage);

    // Bestimme ob Client- oder Server-seitig
    if (file.includes('/client/') || file.includes('/app/') || variable.startsWith('NEXT_PUBLIC_')) {
      clientSide.add(variable);
    } else {
      serverSide.add(variable);
    }
  });

  return { clientSide, serverSide, usageDetails };
}

async function main() {
  console.log('🔍 Suche nach Umgebungsvariablen im Projekt...\n');

  const files = await findFiles('src');
  const usages = await findEnvVars(files);
  const { clientSide, serverSide, usageDetails } = categorizeEnvVars(usages);

  console.log('📊 Übersicht der gefundenen Umgebungsvariablen:\n');

  console.log('🌐 Client-seitige Variablen:');
  Array.from(clientSide).forEach(variable => {
    console.log(`\n${variable}:`);
    usageDetails[variable].forEach(usage => {
      console.log(`  - ${usage.file}:${usage.line}`);
      console.log(`    ${usage.context}`);
    });
  });

  console.log('\n🖥️ Server-seitige Variablen:');
  Array.from(serverSide).forEach(variable => {
    console.log(`\n${variable}:`);
    usageDetails[variable].forEach(usage => {
      console.log(`  - ${usage.file}:${usage.line}`);
      console.log(`    ${usage.context}`);
    });
  });

  console.log('\n📝 Zusammenfassung:');
  console.log(`- Client-seitige Variablen: ${clientSide.size}`);
  console.log(`- Server-seitige Variablen: ${serverSide.size}`);
  console.log(`- Gesamtanzahl der Variablen: ${new Set(Array.from(clientSide).concat(Array.from(serverSide))).size}`);
}

main().catch(console.error); 