// Kookia — Pain et viennoiseries : pas de date imprimée sur le pain frais, une durée estimée à la place.

/** Jours de conservation estimés : pain frais et viennoiseries / pain emballé. */
export const BREAD_DAYS = { fresh: 2, packaged: 7 };

/** Pain emballé (sachet, se garde environ une semaine). Sans accents, au singulier. */
export const PACKAGED_BREAD_WORDS = [
  'pain de mie', 'mie', 'brioche', 'brioche tranchee', 'pain au lait', 'wrap', 'tortilla', 'bagel', 'burger', 'hamburger',
  'hot dog', 'muffin', 'pita', 'naan', 'blini', 'crepe', 'pancake', 'galette', 'pain tranche', 'pain complet tranche', 'tranche'
];

/** Se garde des semaines ou des mois : pas de date estimée (ancienneté au placard, comme l'épicerie). */
export const LONG_LIFE_BREAD_WORDS = [
  'biscotte', 'pain grille', 'cracotte', 'pain suedois', 'gressin', 'chapelure', 'crouton', "pain d'epice", 'pain azyme', 'tartine craquante'
];
