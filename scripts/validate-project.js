import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SKIPPED_DIRECTORIES = new Set(['.git', 'node_modules', '.wrangler']);
const TEXT_EXTENSIONS = new Set([
  '.css', '.html', '.js', '.json', '.md', '.toml', '.txt', '.webmanifest', '.xml', '.yml', '.yaml'
]);
const decoder = new TextDecoder('utf-8', { fatal: true });
const issues = [];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(absolute));
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

for (const file of await filesIn(ROOT)) {
  const relative = path.relative(ROOT, file).replaceAll('\\', '/');
  let text;
  try {
    text = decoder.decode(await readFile(file));
  } catch (error) {
    issues.push(`${relative}: encodage UTF-8 invalide`);
    continue;
  }

  const corruption = /\uFFFD|\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2\u0080[\u0080-\u00bf]/g;
  for (const match of text.matchAll(corruption)) {
    issues.push(`${relative}:${lineNumber(text, match.index)}: caractère corrompu détecté`);
  }

  if (path.extname(file).toLowerCase() === '.json' || path.extname(file).toLowerCase() === '.webmanifest') {
    try {
      JSON.parse(text);
    } catch (error) {
      issues.push(`${relative}: JSON invalide (${error.message})`);
    }
  }
}

if (issues.length) {
  console.error('Validation RCC échouée :');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log('Validation RCC réussie : UTF-8 et JSON valides.');
}
