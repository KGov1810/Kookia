// Aide aux tests : date du jour décalée, en heure locale, au format des produits (« 2026-10-23 »).
// Pas toISOString : elle donne la date UTC, la veille entre minuit et 2 h à Paris (cas réel de test faux la nuit).

export function iso(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
