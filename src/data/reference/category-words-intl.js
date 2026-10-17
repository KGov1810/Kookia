// Kookia — Même vocabulaire qu'en français (category-words.js), en anglais, espagnol et portugais : les noms
// saisis, scannés ou lus dans la langue de l'iPhone trouvent aussi leur catégorie. Le français passe en premier
// quand un mot existe dans deux langues ; les fruits et légumes du catalogue viennent de leurs traductions.

export const STRONG_WORDS_INTL = {
  volaille: 'chicken turkey duck quail pollo pavo pato codorniz frango peru galinha',
  viande: 'beef pork veal lamb mutton rabbit meat brisket sirloin carne cerdo ternera cordero conejo bistec chuleta arrachera porco boi vitela cordeiro coelho picanha alcatra costela maminha fraldinha',
  charcuterie: 'ham sausage salami pepperoni prosciutto jamon salchicha longaniza embutido presunto salsicha linguica mortadela',
  poisson: 'fish salmon tuna cod shrimp prawn mussel crab squid octopus anchovy clam lobster pescado atun bacalao camaron gamba mejillon cangrejo calamar pulpo merluza almeja peixe salmao atum bacalhau camarao mexilhao caranguejo lula polvo sardinha',
  oeufs: 'egg huevo ovo',
  fromage: 'cheese queso queijo requeijao',
  laitier: 'milk yogurt yoghurt butter cream leche yogur mantequilla crema nata leite iogurte manteiga coalhada',
  traiteur: 'soup lasagna burrito empanada enchilada tamal sopa lasanha coxinha',
  boulangerie: 'bread bun pan bolillo pao',
  feculents: 'pasta rice noodle oat oatmeal arroz fideo avena espagueti macarron massa macarrao aveia',
  legumineuses: 'bean lentil chickpea frijol lenteja garbanzo feijao lentilha',
  conserves: 'canned enlatado lata',
  condiments: 'sauce oil vinegar mustard salt spice broth seasoning salsa aceite vinagre mostaza sal pimienta especia caldo consome molho azeite oleo mostarda tempero',
  patisserie: 'flour sugar yeast cocoa vanilla harina azucar levadura cacao vainilla maicena farinha acucar fermento baunilha amido',
  sucre: 'jam jelly chocolate cookie biscuit honey cereal candy mermelada galleta miel dulce geleia biscoito bolacha mel doce',
  snacks: 'chips crisps pretzel popcorn peanut cacahuate mani palomita aceituna amendoim pipoca azeitona',
  fruits_secs: 'nut walnut almond hazelnut pistachio cashew seed nuez almendra avellana pistache semilla noz castanha amendoa avela semente',
  boisson: 'juice soda water beer wine coffee tea jugo refresco agua cerveza vino cafe suco refrigerante cerveja vinho cha',
  surgele: 'frozen helado congelado sorvete picole',
  fruits: 'fruit fig apricot plum berry fruta higo ciruela durazno guayaba figo ameixa goiaba maracuja acai',
  legumes: 'vegetable arugula beet turnip parsley cilantro basil mint verdura hortaliza perejil albahaca menta betabel remolacha salsinha manjericao coentro hortela beterraba mandioca aipim inhame chuchu quiabo'
};

export const WEAK_WORDS_INTL = {
  viande: 'steak roast chop meatball albondiga almondega bife',
  volaille: 'breast thigh wing drumstick pechuga muslo peito coxa sobrecoxa',
  fromage: 'blue'
};

export const PHRASES_INTL = {
  sucre: ['peanut butter', 'dulce de leche', 'maple syrup', 'chocolate spread', 'crema de cacahuate', 'pasta de amendoim'],
  surgele: ['ice cream', 'frozen pizza', 'frozen vegetables', 'fish sticks'],
  viande: ['ground beef', 'minced meat', 'carne molida', 'carne picada', 'carne moida'],
  legumes: ['bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'green bean'],
  condiments: ['black pepper', 'soy sauce', 'olive oil', 'tomato sauce', 'pasta sauce', 'salsa de soya', 'aceite de oliva', 'molho de soja', 'molho de tomate', 'pimienta negra', 'pimenta do reino'],
  conserves: ['coconut milk', 'leche de coco', 'leite de coco', 'frijoles refritos'],
  boisson: ['almond milk', 'oat milk', 'soy milk', 'leche de almendra', 'leche de avena', 'leite de amendoa', 'leite de aveia'],
  fromage: ['cream cheese', 'queso crema', 'cottage cheese'],
  laitier: ['sour cream', 'condensed milk', 'leche condensada', 'leite condensado', 'creme de leite', 'arroz con leche'],
  boulangerie: ['pan de molde', 'pao de forma', 'pao de queijo', 'sandwich bread'],
  traiteur: ['puff pastry', 'pizza dough', 'masa de hojaldre', 'massa folhada'],
  legumineuses: ['grao de bico'],
  feculents: ['corn flake', 'rolled oat']
};

export const QUALIFIER_WORDS_INTL = 'flavor flavour flavored style sabor estilo';
export const FROZEN_WORDS_INTL = 'frozen congelado congelada';
export const CONTAINER_WORDS_INTL = 'canned tin lata enlatado frasco';
export const DRIED_WORDS_INTL = 'dried dry seco seca deshidratado desidratado';
