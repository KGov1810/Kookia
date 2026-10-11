// Kookia — Vocabulaire pour proposer une catégorie d'après le nom d'un produit.
// Écrit en français courant (accents, pluriels) : il est normalisé au chargement.

/** Mots « forts » : ils désignent l'aliment. Le premier trouvé dans le nom l'emporte. */
export const STRONG_WORDS = {
  volaille: 'poulet dinde canard pintade volaille caille chapon coquelet magret nugget oie poularde gésier pilon manchon',
  viande: 'bœuf boeuf veau porc agneau mouton lapin cheval gibier chevreuil sanglier bavette entrecôte viande côtelette gigot paleron rumsteck rumsteak onglet hampe tournedos joue jarret échine travers collier bourguignon blanquette carpaccio tartare kebab kefta paupiette tendron',
  charcuterie: 'jambon saucisson lardon chorizo bacon rillettes salami coppa pancetta mortadelle saucisse merguez boudin terrine pâté andouille andouillette chipolata knack cervelas rosette bresaola speck campagne',
  poisson: 'poisson saumon thon cabillaud colin sardine maquereau truite crevette moule crabe surimi merlu dorade daurade calamar huître sole lotte églefin haddock hareng anchois gambas langoustine homard poulpe seiche encornet tilapia pangasius perche flétan rouget raie bulot bigorneau palourde tarama',
  oeufs: 'œuf oeuf',
  fromage: 'fromage emmental comté camembert brie mozzarella parmesan chèvre roquefort raclette feta gruyère cheddar ricotta mascarpone reblochon gorgonzola tomme mimolette burrata halloumi munster morbier cantal beaufort ossau manchego gouda edam maroilles coulommiers fourme fondue boursin kiri babybel chaource époisses crottin',
  laitier: 'lait yaourt yogourt yoghourt crème beurre skyr kéfir faisselle flan',
  traiteur: 'pizza quiche lasagne gratin taboulé sandwich sushi nem samoussa soupe velouté hachis tarte cannelloni ravioli tortellini gaspacho houmous hummus tzatziki guacamole tapenade tofu seitan tempeh falafel parmentier paella risotto',
  boulangerie: 'pain baguette brioche croissant viennoiserie biscotte tortilla wrap bagel crêpe chocolatine muffin pita naan focaccia ciabatta',
  feculents: 'pâtes riz semoule quinoa couscous boulgour bulgur nouille spaghetti tagliatelle penne macaroni coquillette farfalle fusilli polenta vermicelle gnocchi flocon avoine blé orge linguine rigatoni',
  legumineuses: 'lentille chiche flageolet fève haricot soja lupin',
  conserves: 'conserve boîte bocal concentré ratatouille cassoulet',
  condiments: 'sauce huile vinaigre moutarde ketchup mayonnaise pesto bouillon épice harissa cornichon sel poivre curry paprika cumin cannelle tabasco câpre vinaigrette aïoli thym laurier romarin origan muscade safran curcuma sriracha wasabi',
  patisserie: 'farine sucre levure maïzena fécule cacao vanille gélatine amidon cassonade vergeoise bicarbonate agar-agar nappage',
  sucre: 'confiture compote chocolat biscuit gâteau miel céréale nutella bonbon cookie madeleine muesli granola brownie gaufre speculoos sablé caramel marshmallow',
  snacks: 'chips cracker bretzel popcorn cacahuète olive apéricube',
  fruits_secs: 'noix amande noisette pistache cajou datte pruneau graine sésame tournesol chia macadamia',
  boisson: 'jus sirop soda eau bière vin café smoothie tisane infusion cidre limonade cola coca champagne boisson thé nectar rhum whisky vodka pastis porto cognac liqueur kombucha orangina fanta sprite chicorée',
  surgele: 'glace sorbet surgelé esquimau congelé frite',
  fruits: 'fruit figue abricot prune mirabelle nectarine groseille cassis mûre grenade papaye litchi pamplemousse mandarine kaki coing rhubarbe',
  legumes: 'légume artichaut asperge betterave navet panais topinambour endive mâche roquette cresson blette laitue frisée batavia mesclun persil basilic coriandre ciboulette menthe aneth estragon patate'
};

/** Mots « faibles » : un morceau ou une forme, utilisés seulement si aucun mot fort n'est trouvé. */
export const WEAK_WORDS = {
  viande: 'steak rôti haché côte épaule boulette pavé',
  volaille: 'filet escalope cuisse aiguillette blanc aile émincé brochette',
  fromage: 'bleu',
  sucre: 'barre'
};

/** Expressions : elles passent avant les mots seuls qui les composent (« pain au chocolat »). */
export const PHRASES = {
  boulangerie: ['pain au chocolat', 'pain au lait', 'pain aux raisins'],
  patisserie: ['sucre glace', 'chocolat pâtissier', 'chocolat à pâtisser', 'chocolat dessert', 'chocolat noir dessert', 'pépite de chocolat', 'pâte d\'amande', 'poudre d\'amande', 'levure boulangère'],
  sucre: ['pâte à tartiner', 'crème de marrons', 'pain d\'épices', 'pâte de fruits', 'beurre de cacahuète', 'sirop d\'érable', 'chocolat en poudre', 'biscuit au beurre'],
  traiteur: ['pâte feuilletée', 'pâte brisée', 'pâte sablée', 'pâte à pizza', 'pâte à crêpe', 'salade de pâtes', 'salade composée', 'salade piémontaise', 'salade niçoise', 'plat cuisiné', 'plat préparé', 'steak de soja', 'steak végétal', 'galette de légumes'],
  laitier: ['fromage blanc', 'petit suisse', 'crème dessert', 'riz au lait', 'lait concentré', 'mousse au chocolat'],
  surgele: ['crème glacée', 'bâtonnet glacé'],
  boisson: ['lait d\'amande', 'lait d\'avoine', 'lait de soja', 'lait de riz', 'boisson végétale', 'ice tea', 'chocolat chaud'],
  conserves: ['lait de coco', 'crème de coco', 'maïs doux', 'petits pois', 'thon au naturel', 'thon à l\'huile', 'sardines à l\'huile', 'tomates pelées', 'pulpe de tomate', 'coulis de tomate', 'purée de tomate', 'cœur de palmier', 'fond d\'artichaut', 'fruits au sirop'],
  condiments: ['sauce soja', 'herbes de provence', 'fond de veau', 'fond de volaille', 'ras el hanout', 'fleur de sel', 'noix de muscade'],
  charcuterie: ['foie gras', 'pâté de campagne', 'pâté en croûte', 'mousse de canard', 'mousse de foie', 'viande des grisons'],
  volaille: ['cordon bleu'],
  viande: ['faux filet', 'filet mignon', 'osso bucco', 'osso buco', 'pot au feu', 'noix de veau', 'viande hachée'],
  poisson: ['fruits de mer', 'saint jacques', 'noix de saint jacques', 'lieu noir', 'œufs de lump', 'poisson pané'],
  snacks: ['biscuit apéritif', 'tortilla chips'],
  feculents: ['feuilles de lasagne', 'purée en flocons'],
  legumineuses: ['pois chiches', 'pois cassés']
};

/** Mots après lesquels le reste du nom ne décrit qu'un goût ou un usage (« farine spéciale sauces »). */
export const QUALIFIER_WORDS = 'saveur goût parfum façon spécial spéciale pour arôme aromatisé aromatisée';

/** Un de ces mots n'importe où : le produit est surgelé, ou en conserve. */
export const FROZEN_WORDS = 'surgelé congelé';
export const CONTAINER_WORDS = 'conserve boîte bocal';

/** Séché : un fruit ou un légume séché devient un fruit sec. */
export const DRIED_WORDS = 'sec sèche séché séchée déshydraté';
