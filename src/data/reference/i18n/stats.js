// Kookia — Textes de l'écran Statistiques (stock en ce moment, période, filtres, sorti du stock, dépensé).
// Chaque texte : [français, anglais, espagnol (Amérique latine), portugais (Brésil)].

export const STATS = {
  'stats.title': ['Statistiques', 'Statistics', 'Estadísticas', 'Estatísticas'],
  'stats.periodAria': ['Période (le stock en haut n\'en dépend pas)', 'Period (the stock at the top doesn\'t depend on it)', 'Periodo (el inventario de arriba no depende de él)', 'Período (o estoque no topo não depende dele)'],
  'stats.noHousehold': ['Les statistiques s\'affichent une fois le foyer connecté.', 'Statistics appear once the household is connected.', 'Las estadísticas aparecen cuando el hogar está conectado.', 'As estatísticas aparecem quando a casa estiver conectada.'],
  'stats.denied': ['Les statistiques ne sont pas encore autorisées : recollez les règles Firestore (fichier firestore.rules, README).', 'Statistics aren\'t allowed yet: paste the Firestore rules again (firestore.rules file, README).', 'Las estadísticas aún no están permitidas: vuelve a pegar las reglas de Firestore (archivo firestore.rules, README).', 'As estatísticas ainda não estão liberadas: cole de novo as regras do Firestore (arquivo firestore.rules, README).'],
  'period.mois': ['Ce mois', 'This month', 'Este mes', 'Este mês'],
  'period.3mois': ['3 mois', '3 months', '3 meses', '3 meses'],
  'period.12mois': ['12 mois', '12 months', '12 meses', '12 meses'],
  'period.tout': ['Tout', 'All', 'Todo', 'Tudo'],
  'phrase.mois': ['ce mois-ci', 'this month', 'este mes', 'este mês'],
  'phrase.3mois': ['sur 3 mois', 'over 3 months', 'en 3 meses', 'em 3 meses'],
  'phrase.12mois': ['sur 12 mois', 'over 12 months', 'en 12 meses', 'em 12 meses'],
  'phrase.tout': ['depuis le début', 'since the start', 'desde el inicio', 'desde o início'],

  // Stock en ce moment
  'sstock.empty': ['Le stock est vide pour l\'instant.', 'The stock is empty for now.', 'El inventario está vacío por ahora.', 'O estoque está vazio por enquanto.'],
  'sstock.aria': ['Valeur du stock en ce moment', 'Value of the stock right now', 'Valor del inventario ahora', 'Valor do estoque agora'],
  'sstock.now': ['En stock maintenant', 'In stock now', 'En inventario ahora', 'No estoque agora'],
  'sstock.soon': [['{amount} à consommer vite, sur {n} produit', '{amount} à consommer vite, sur {n} produits'], ['{amount} to use soon, across {n} product', '{amount} to use soon, across {n} products'], ['{amount} por consumir pronto, en {n} producto', '{amount} por consumir pronto, en {n} productos'], ['{amount} para consumir logo, em {n} produto', '{amount} para consumir logo, em {n} produtos']],
  'sstock.unpriced': [['{n} produit sans prix n\'est pas compté.', '{n} produits sans prix ne sont pas comptés.'], ['{n} product without a price isn\'t counted.', '{n} products without a price aren\'t counted.'], ['{n} producto sin precio no se cuenta.', '{n} productos sin precio no se cuentan.'], ['{n} produto sem preço não é contado.', '{n} produtos sem preço não são contados.']],
  'sstock.noPrice': ['Aucun produit en stock n\'a encore de prix : ajoutez-le dans leur fiche, ou scannez vos tickets de caisse.', 'No product in stock has a price yet: add it on their sheet, or scan your receipts.', 'Ningún producto del inventario tiene precio todavía: agrégalo en su ficha o escanea tus tickets.', 'Nenhum produto do estoque tem preço ainda: adicione na ficha ou escaneie seus cupons.'],

  // Sorti du stock
  'out.title': ['Sorti du stock {period}', 'Out of stock {period}', 'Salió del inventario {period}', 'Saiu do estoque {period}'],
  'out.consumed': ['Consommé', 'Used', 'Consumido', 'Consumido'],
  'out.wasted': ['Jeté', 'Thrown out', 'Tirado', 'Jogado fora'],
  'out.noPrice': ['Rien n\'est encore sorti du stock avec un prix connu sur cette période.', 'Nothing with a known price has left the stock in this period yet.', 'Todavía no salió nada con precio conocido en este periodo.', 'Nada com preço conhecido saiu do estoque neste período ainda.'],
  'out.noWaste': ['Rien de jeté sur cette période.', 'Nothing thrown out in this period.', 'Nada tirado en este periodo.', 'Nada jogado fora neste período.'],
  'out.share': ['{percent} % de ce qui est sorti du stock a été jeté.', '{percent}% of what left the stock was thrown out.', 'Se tiró el {percent} % de lo que salió del inventario.', '{percent}% do que saiu do estoque foi jogado fora.'],
  'out.lessThan1': ['Moins de 1', 'Less than 1', 'Menos del 1', 'Menos de 1'],
  'unpriced.purchases': [['{n} achat', '{n} achats'], ['{n} purchase', '{n} purchases'], ['{n} compra', '{n} compras'], ['{n} compra', '{n} compras']],
  'unpriced.consumed': [['{n} consommation', '{n} consommations'], ['{n} use', '{n} uses'], ['{n} consumo', '{n} consumos'], ['{n} consumo', '{n} consumos']],
  'unpriced.wasted': [['{n} produit jeté', '{n} produits jetés'], ['{n} product thrown out', '{n} products thrown out'], ['{n} producto tirado', '{n} productos tirados'], ['{n} produto jogado fora', '{n} produtos jogados fora']],
  'unpriced.note': ['Sans prix, non comptés : {list}. Ajoutez le prix dans la fiche d\'un produit, ou scannez vos tickets de caisse.', 'No price, not counted: {list}. Add the price on a product\'s sheet, or scan your receipts.', 'Sin precio, no contados: {list}. Agrega el precio en la ficha de un producto o escanea tus tickets.', 'Sem preço, não contados: {list}. Adicione o preço na ficha de um produto ou escaneie seus cupons.'],
  'wasted.title': ['Les plus jetés', 'Most thrown out', 'Lo más tirado', 'Os mais jogados fora'],
  'wasted.unknown': ['prix inconnu', 'unknown price', 'precio desconocido', 'preço desconhecido'],
  'stats.noMatch': ['Rien pour ces filtres sur cette période.', 'Nothing for these filters in this period.', 'Nada con estos filtros en este periodo.', 'Nada para estes filtros neste período.'],
  'stats.reset': ['Retirer les filtres', 'Clear filters', 'Quitar los filtros', 'Remover os filtros'],
  'stats.emptyTitle': ['Pas encore de chiffres', 'No figures yet', 'Todavía no hay cifras', 'Ainda sem números'],
  'stats.emptyText': ['Chaque produit ajouté, consommé ou jeté est noté à partir de maintenant, avec son prix s\'il est connu.', 'Every product added, used or thrown out is recorded from now on, with its price if known.', 'Cada producto agregado, consumido o tirado se registra desde ahora, con su precio si se conoce.', 'Cada produto adicionado, consumido ou jogado fora é registrado a partir de agora, com o preço se for conhecido.'],
  'stats.emptyTip': ['Le plus simple pour les prix : scannez vos tickets de caisse (bouton + au centre de la barre du bas).', 'The easiest way to get prices: scan your receipts (+ button in the middle of the bottom bar).', 'Lo más fácil para los precios: escanea tus tickets (botón + en el centro de la barra de abajo).', 'O jeito mais fácil de ter os preços: escaneie seus cupons (botão + no meio da barra de baixo).'],

  // Dépensé
  'spent.thisMonth': ['Dépensé ce mois-ci', 'Spent this month', 'Gastado este mes', 'Gasto este mês'],
  'spent.byMonth': ['Dépensé par mois', 'Spent per month', 'Gastado por mes', 'Gasto por mês'],
  'spent.chart': ['Graphique', 'Chart', 'Gráfico', 'Gráfico'],
  'spent.table': ['Tableau', 'Table', 'Tabla', 'Tabela'],
  'spent.month': ['Mois', 'Month', 'Mes', 'Mês'],
  'spent.spent': ['Dépensé', 'Spent', 'Gastado', 'Gasto'],
  'spent.wasted': ['Jeté', 'Thrown out', 'Tirado', 'Jogado fora'],
  'spent.sentence': ['{month} : {spent} dépensés, dont {wasted} jetés', '{month}: {spent} spent, {wasted} of it thrown out', '{month}: {spent} gastados, {wasted} tirados', '{month}: {spent} gastos, {wasted} jogados fora'],
  'spent.detail': ['{spent} dépensés en {month}, dont {wasted} jetés', '{spent} spent in {month}, {wasted} of it thrown out', '{spent} gastados en {month}, {wasted} tirados', '{spent} gastos em {month}, {wasted} jogados fora'],
  'spent.byCategory': ['Dépenses par catégorie', 'Spending by category', 'Gastos por categoría', 'Gastos por categoria'],
  'spent.catAria': ['{category} : {spent} dépensés{wasted}. Filtrer sur cette catégorie', '{category}: {spent} spent{wasted}. Filter on this category', '{category}: {spent} gastados{wasted}. Filtrar por esta categoría', '{category}: {spent} gastos{wasted}. Filtrar por esta categoria'],
  'spent.catWasted': [', {wasted} jetés', ', {wasted} thrown out', ', {wasted} tirados', ', {wasted} jogados fora'],
  'spent.catWaste': ['Jeté : {wasted}', 'Thrown out: {wasted}', 'Tirado: {wasted}', 'Jogado fora: {wasted}'],

  // Filtres
  'sfilter.aria': ['Filtres', 'Filters', 'Filtros', 'Filtros'],
  'sfilter.products': ['Produits', 'Products', 'Productos', 'Produtos'],
  'sfilter.allProducts': ['Tous les produits', 'All products', 'Todos los productos', 'Todos os produtos'],
  'sfilter.aisles': ['Rayons', 'Aisles', 'Pasillos', 'Seções'],
  'sfilter.aisle': ['Rayon {name}', '{name} aisle', 'Pasillo {name}', 'Seção {name}'],
  'sfilter.place': ['Lieu', 'Place', 'Lugar', 'Local'],
  'sfilter.allPlaces': ['Tous les lieux', 'All places', 'Todos los lugares', 'Todos os locais'],
  'sfilter.person': ['Personne', 'Person', 'Persona', 'Pessoa'],
  'sfilter.everyone': ['Tout le monde', 'Everyone', 'Todos', 'Todo mundo']
};
