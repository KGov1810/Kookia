// Kookia — Textes de la fiche d'une recette, de ses ingrédients, du partage et de « J'ai cuisiné ».
// Chaque texte : [français, anglais, espagnol (Amérique latine), portugais (Brésil)].

export const RECIPE = {
  'detail.title': ['Recette', 'Recipe', 'Receta', 'Receita'],
  'detail.deleted': ['Cette recette a été supprimée.', 'This recipe has been deleted.', 'Esta receta se eliminó.', 'Esta receita foi excluída.'],
  'detail.prep': [', dont {time} de préparation', ', including {time} prep', ', {time} de preparación', ', sendo {time} de preparo'],
  'detail.favorite': ['Ajouter aux favoris', 'Add to favorites', 'Agregar a favoritas', 'Adicionar às favoritas'],
  'detail.unfavorite': ['Retirer des favoris', 'Remove from favorites', 'Quitar de favoritas', 'Remover das favoritas'],
  'detail.onMenu': ['Au menu : {when}', 'On the menu: {when}', 'En el menú: {when}', 'No cardápio: {when}'],
  'detail.leftovers': ['{slot} (restes)', '{slot} (leftovers)', '{slot} (sobras)', '{slot} (sobras)'],
  'detail.kcal': ['≈ {kcal} kcal par portion', '≈ {kcal} kcal per serving', '≈ {kcal} kcal por porción', '≈ {kcal} kcal por porção'],
  'detail.estimate': ['(estimation)', '(estimate)', '(estimado)', '(estimativa)'],
  'detail.noKcal': ['Calories non estimées (recette créée avant cette fonction).', 'Calories not estimated (recipe created before this feature).', 'Calorías no estimadas (receta creada antes de esta función).', 'Calorias não estimadas (receita criada antes desta função).'],
  'detail.ingredients': ['Ingrédients', 'Ingredients', 'Ingredientes', 'Ingredientes'],
  'detail.portions': ['Portions', 'Servings', 'Porciones', 'Porções'],
  'detail.lessPortion': ['Une portion de moins', 'One serving less', 'Una porción menos', 'Uma porção a menos'],
  'detail.morePortion': ['Une portion de plus', 'One more serving', 'Una porción más', 'Uma porção a mais'],
  'detail.rescaled': ['Quantités recalculées (recette prévue pour {n}). Les temps de cuisson restent indicatifs.', 'Quantities recalculated (recipe made for {n}). Cooking times are a guide.', 'Cantidades recalculadas (receta pensada para {n}). Los tiempos de cocción son orientativos.', 'Quantidades recalculadas (receita feita para {n}). Os tempos de cozimento são aproximados.'],
  'detail.addMissing': [['Ajouter l\'ingrédient qui manque aux courses', 'Ajouter les {n} ingrédients qui manquent aux courses'], ['Add the missing ingredient to the shopping list', 'Add the {n} missing ingredients to the shopping list'], ['Agregar el ingrediente que falta a la lista', 'Agregar los {n} ingredientes que faltan a la lista'], ['Adicionar o ingrediente que falta à lista', 'Adicionar os {n} ingredientes que faltam à lista']],
  'detail.added': [['{n} ingrédient ajouté aux courses', '{n} ingrédients ajoutés aux courses'], ['{n} ingredient added to the shopping list', '{n} ingredients added to the shopping list'], ['{n} ingrediente agregado a la lista', '{n} ingredientes agregados a la lista'], ['{n} ingrediente adicionado à lista', '{n} ingredientes adicionados à lista']],
  'detail.already': ['Déjà dans la liste de courses', 'Already on the shopping list', 'Ya está en la lista de compras', 'Já está na lista de compras'],
  'detail.steps': ['Préparation', 'Method', 'Preparación', 'Modo de preparo'],
  'detail.storage': ['Conservation', 'Storage', 'Conservación', 'Conservação'],
  'detail.keeps': [['Se garde {n} jour au réfrigérateur.', 'Se garde {n} jours au réfrigérateur.'], ['Keeps {n} day in the fridge.', 'Keeps {n} days in the fridge.'], ['Se conserva {n} día en el refrigerador.', 'Se conserva {n} días en el refrigerador.'], ['Dura {n} dia na geladeira.', 'Dura {n} dias na geladeira.']],
  'detail.cooked': ['J\'ai cuisiné cette recette', 'I cooked this recipe', 'Cociné esta receta', 'Cozinhei esta receita'],
  'detail.share': ['Partager la recette', 'Share the recipe', 'Compartir la receta', 'Compartilhar a receita'],
  'detail.delete': ['Supprimer la recette', 'Delete the recipe', 'Eliminar la receta', 'Excluir a receita'],
  'detail.confirmDelete': ['Supprimer cette recette sur les deux iPhone ?', 'Delete this recipe on both iPhones?', '¿Eliminar esta receta en los dos iPhone?', 'Excluir esta receita nos dois iPhones?'],
  'detail.removes': ['« J\'ai cuisiné » retire une unité de : {names}.', '"I cooked it" removes one unit of: {names}.', '"Ya lo cociné" quita una unidad de: {names}.', '"Já cozinhei" tira uma unidade de: {names}.'],

  // Texte partagé
  'share.servings': [['pour {n} portion', 'pour {n} portions'], ['for {n} serving', 'for {n} servings'], ['para {n} porción', 'para {n} porciones'], ['para {n} porção', 'para {n} porções']],
  'share.kcal': ['environ {kcal} kcal par portion', 'about {kcal} kcal per serving', 'unas {kcal} kcal por porción', 'cerca de {kcal} kcal por porção'],
  'share.cuisine': ['cuisine {origin}', '{origin} cuisine', 'cocina {origin}', 'culinária {origin}'],
  'share.ingredients': ['Ingrédients :', 'Ingredients:', 'Ingredientes:', 'Ingredientes:'],
  'share.steps': ['Préparation :', 'Method:', 'Preparación:', 'Modo de preparo:'],
  'share.storage': ['Conservation : {tips}', 'Storage: {tips}', 'Conservación: {tips}', 'Conservação: {tips}'],

  // Ingrédients
  'ing.onList': ['Sur la liste de courses', 'On the shopping list', 'En la lista de compras', 'Na lista de compras'],
  'ing.noMore': ['Plus en stock', 'Out of stock', 'Ya no hay', 'Acabou'],
  'ing.toBuy': ['À acheter', 'To buy', 'Por comprar', 'Para comprar'],
  'ing.sameBarcode': ['{place} (même code-barres)', '{place} (same barcode)', '{place} (mismo código de barras)', '{place} (mesmo código de barras)'],
  'ing.similar': ['{place} (produit similaire)', '{place} (similar product)', '{place} (producto similar)', '{place} (produto parecido)'],

  // « J'ai cuisiné »
  'cook.preview': ['Retire {names} du stock en un toucher.', 'Removes {names} from stock in one tap.', 'Quita {names} del inventario con un toque.', 'Tira {names} do estoque com um toque.'],
  'cook.noted': ['Repas noté comme cuisiné', 'Meal marked as cooked', 'Comida marcada como cocinada', 'Refeição marcada como feita'],
  'cook.confirm': ['Retirer du stock ?', 'Remove from stock?', '¿Quitar del inventario?', 'Tirar do estoque?'],
  'cook.updated': [['{n} produit mis à jour dans le stock', '{n} produits mis à jour dans le stock'], ['{n} product updated in stock', '{n} products updated in stock'], ['{n} producto actualizado en el inventario', '{n} productos actualizados en el inventario'], ['{n} produto atualizado no estoque', '{n} produtos atualizados no estoque']],
  'cook.detail': ['{text} : {names}', '{text}: {names}', '{text}: {names}', '{text}: {names}'],
  'rest.none': ['plus en stock', 'none left', 'ya no queda', 'acabou'],
  'rest.whole': ['il en reste {n}', '{n} left', 'quedan {n}', 'restam {n}'],
  'rest.opened': ['il en reste {rest}', '{rest} left', 'queda {rest}', 'resta {rest}'],
  'rest.both': ['il en reste {n} + {rest} entamé', '{n} left, plus {rest} opened', 'quedan {n} y {rest} abierto', 'restam {n} e {rest} aberto']
};
