// Simulation de firebase/app pour les tests.
export function initializeApp(config) { globalThis.__fbConfig = config; return { config }; }
