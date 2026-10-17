// Kookia — Langues de l'application : code, nom dans la langue elle-même, format des dates et des nombres.
// L'ordre est celui des traductions dans les dictionnaires : [français, anglais, espagnol, portugais].

export const LANGUAGES = [
  { id: 'fr', label: 'Français', tag: 'fr-FR' },
  { id: 'en', label: 'English', tag: 'en-US' },
  { id: 'es', label: 'Español', tag: 'es-419' }, // Amérique latine
  { id: 'pt', label: 'Português', tag: 'pt-BR' } // Brésil
];

export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id);
