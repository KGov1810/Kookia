// Tests : règles d'architecture (sens des dépendances entre couches, taille des fichiers).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const MAX_LINES = 200;

/** Couches, de la plus haute à la plus basse : une couche n'utilise que celles autorisées. */
const ALLOWED = {
  main: ['views', 'components', 'store', 'reference', 'services'],
  views: ['views', 'components', 'store', 'reference', 'services'],
  components: ['components', 'store', 'reference', 'services'],
  store: ['store', 'reference', 'services'],
  services: ['services', 'reference'],
  reference: ['reference']
};

function layerOf(file) {
  const rel = path.relative(SRC, file).replace(/\\/g, '/');
  if (rel.startsWith('views/')) return 'views';
  if (rel.startsWith('components/')) return 'components';
  if (rel.startsWith('data/store/')) return 'store';
  if (rel.startsWith('data/reference/')) return 'reference';
  if (rel.startsWith('services/')) return 'services';
  return 'main';
}

function sourceFiles(dir = SRC, extensions = ['.js'], out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, extensions, out);
    else if (extensions.some((ext) => full.endsWith(ext))) out.push(full);
  }
  return out;
}

const jsFiles = sourceFiles().filter((f) => !f.includes(`${path.sep}sw${path.sep}`));

describe('sens des dépendances', () => {
  it.each(jsFiles.map((f) => [path.relative(SRC, f), f]))('%s', (_name, file) => {
    const code = fs.readFileSync(file, 'utf8');
    const wrong = [...code.matchAll(/from '(\.[^']+)'/g)]
      .map((m) => path.resolve(path.dirname(file), m[1]))
      .filter((target) => !ALLOWED[layerOf(file)].includes(layerOf(target)))
      .map((target) => `${layerOf(file)} → ${layerOf(target)} (${path.relative(SRC, target)})`);
    expect(wrong, 'une couche utilise une couche qui ne lui est pas permise').toEqual([]);
  });
});

describe(`fichiers de ${MAX_LINES} lignes au plus`, () => {
  it.each(sourceFiles(SRC, ['.js', '.css']).map((f) => [path.relative(SRC, f), f]))('%s', (_name, file) => {
    expect(fs.readFileSync(file, 'utf8').split('\n').length).toBeLessThanOrEqual(MAX_LINES);
  });
});
