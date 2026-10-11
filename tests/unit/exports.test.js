// Règle : dans une couche réexportée par son index.js, deux fichiers ne doivent pas exporter le même nom
// (avec « export * », l'un masquerait l'autre sans erreur visible).
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test.each(['src/services', 'src/data/store', 'src/data/reference'])('%s : aucun nom exporté deux fois', (dir) => {
  const index = readFileSync(join(dir, 'index.js'), 'utf8');
  const files = [...index.matchAll(/from '\.\/(.+?)'/g)].map((m) => m[1]);
  const seen = new Map();
  const doubles = [];
  for (const file of files) {
    const source = readFileSync(join(dir, file), 'utf8');
    for (const [, name] of source.matchAll(/export (?:async )?(?:function|const|class|let) (\w+)/g)) {
      if (seen.has(name)) doubles.push(`${name} : ${seen.get(name)} et ${file}`);
      else seen.set(name, file);
    }
  }
  expect(doubles).toEqual([]);
});
