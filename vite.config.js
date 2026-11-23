import { defineConfig } from 'vite';
import { serviceWorkerPlugin } from './build/service-worker-plugin.js';

export default defineConfig({
  // Chemins relatifs : le site fonctionne à n'importe quelle adresse (ex. pseudo.github.io/kookia/).
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
    // Firebase seul dépasse 500 Ko (normal pour ce SDK) ; le code de l'app en fait environ 380, plus les écrans rares
    // chargés à leur premier usage (views/app/lazy.js).
    chunkSizeWarningLimit: 650,
    rolldownOptions: {
      output: {
        // Firebase dans son propre fichier : il change rarement, le téléphone le garde en cache.
        codeSplitting: { groups: [{ name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/ }] }
      }
    }
  },
  plugins: [serviceWorkerPlugin()],
  test: {
    environment: 'jsdom',
    // Un navigateur de test par processus, réutilisé d'un fichier à l'autre (chaque fichier garde ses propres modules) :
    // la suite passe d'environ 70 à 20 secondes, le navigateur n'étant plus recréé pour chacun des fichiers.
    pool: 'vmThreads',
    environmentOptions: { jsdom: { url: 'https://exemple.github.io/kookia/' } },
    setupFiles: ['tests/setup.js'],
    include: ['tests/**/*.test.js'],
    testTimeout: 60_000,
    hookTimeout: 30_000
  }
});
