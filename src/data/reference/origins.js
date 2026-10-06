// Kookia — Cuisines du monde (origine des recettes).

/** Cuisines proposées. « monde » = Tour du monde (origines variées, hors cuisine française). */
export const ORIGINS = [
  { id: 'monde', label: 'Tour du monde', emoji: '✈️' },
  { id: 'francaise', label: 'Française', emoji: '🇫🇷' },
  { id: 'italienne', label: 'Italienne', emoji: '🇮🇹' },
  { id: 'espagnole', label: 'Espagnole', emoji: '🇪🇸' },
  { id: 'grecque', label: 'Grecque', emoji: '🇬🇷' },
  { id: 'maghrebine', label: 'Maghrébine', emoji: '🥘' },
  { id: 'libanaise', label: 'Libanaise', emoji: '🇱🇧' },
  { id: 'indienne', label: 'Indienne', emoji: '🇮🇳' },
  { id: 'chinoise', label: 'Chinoise', emoji: '🇨🇳' },
  { id: 'japonaise', label: 'Japonaise', emoji: '🇯🇵' },
  { id: 'thaie', label: 'Thaïe', emoji: '🇹🇭' },
  { id: 'vietnamienne', label: 'Vietnamienne', emoji: '🇻🇳' },
  { id: 'coreenne', label: 'Coréenne', emoji: '🇰🇷' },
  { id: 'mexicaine', label: 'Mexicaine', emoji: '🇲🇽' },
  { id: 'bresilienne', label: 'Brésilienne', emoji: '🇧🇷' },
  { id: 'americaine', label: 'Américaine', emoji: '🇺🇸' },
  { id: 'africaine', label: 'Africaine', emoji: '🌍' }
];

/** Origine d'une recette (hors « Tour du monde ») ou null. */
export function originOf(id) {
  return ORIGINS.find((o) => o.id === id && o.id !== 'monde') ?? null;
}
