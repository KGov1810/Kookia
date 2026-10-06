// Kookia — génère dist/sw.js au build, avec la liste exacte des fichiers à mettre en cache.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function serviceWorkerPlugin() {
  let publicDir = 'public';
  return {
    name: 'kookia-service-worker',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((name) => !name.endsWith('.map'));
      const publicFiles = fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [];
      const files = ['./', ...[...built, ...publicFiles].map((f) => `./${f}`)];
      const version = `kookia-${crypto.createHash('sha256').update(built.sort().join('|')).digest('hex').slice(0, 10)}`;
      const template = fs.readFileSync(path.resolve('src/sw/service-worker.js'), 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replaceAll('__VERSION__', version).replaceAll('__PRECACHE__', JSON.stringify(files, null, 2))
      });
    }
  };
}
