import { defineConfig } from 'vite';
import { serviceWorkerPlugin } from './build/service-worker-plugin.js';

export default defineConfig({
  // Chemins relatifs : le site fonctionne à n'importe quelle adresse (ex. pseudo.github.io/kookia/).
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
    // Firebase seul dépasse 500 Ko (normal pour ce SDK) ; le code de l'app en fait environ 140.
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
    environmentOptions: { jsdom: { url: 'https://exemple.github.io/kookia/' } },
    setupFiles: ['tests/setup.js'],
    include: ['tests/**/*.test.js'],
    testTimeout: 60_000,
    hookTimeout: 30_000
  }
});
