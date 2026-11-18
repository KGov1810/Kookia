// Kookia — Modèles Claude proposés.

// note : clé du texte qui suit le nom (« conseillé », « économique »), traduit à l'affichage.
export const MODELS = [
  { id: 'claude-sonnet-5-5', name: 'Sonnet 5.5', note: 'settings.modelRecommended' },
  { id: 'claude-haiku-5-5', name: 'Haiku 5.5', note: 'settings.modelCheap' }
];

/** Modèles qui ne sont plus proposés → leur remplaçant (un réglage déjà enregistré bascule tout seul). */
export const REPLACED_MODELS = { 'claude-haiku-4-5': 'claude-haiku-5-5' };
