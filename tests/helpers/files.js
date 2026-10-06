// Lecture des fichiers du projet depuis les tests (lancés depuis la racine du projet).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

export function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

/** Toutes les feuilles de style, dans l'ordre où elles sont chargées. */
export function readAllCss() {
  const dir = path.join(ROOT, 'src', 'styles');
  const index = fs.readFileSync(path.join(dir, 'index.css'), 'utf8');
  const imports = [...index.matchAll(/@import\s+['"](.+?)['"]/g)].map((m) => m[1]);
  if (!imports.length) return index;
  return imports.map((file) => fs.readFileSync(path.join(dir, file), 'utf8')).join('\n');
}
