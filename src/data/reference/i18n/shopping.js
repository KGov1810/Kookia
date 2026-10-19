// Kookia — Textes de l'écran Courses (liste, panier, fiche d'un article, « Tout ranger »).
// Chaque texte : [français, anglais, espagnol (Amérique latine), portugais (Brésil)].

export const SHOPPING = {
  'shop.scanTicket': ['Scanner le ticket', 'Scan receipt', 'Escanear ticket', 'Escanear cupom'],
  'shop.addPlaceholder': ['Ajouter (ex. 2 lait, farine 1 kg)', 'Add (e.g. 2 milk, flour 1 kg)', 'Agregar (ej. 2 leche, harina 1 kg)', 'Adicionar (ex. 2 leite, farinha 1 kg)'],
  'shop.addAria': ['Article à acheter, avec le nombre devant si besoin', 'Item to buy, with the number first if needed', 'Artículo por comprar, con la cantidad delante si hace falta', 'Item para comprar, com a quantidade na frente se precisar'],
  'shop.add': ['Ajouter', 'Add', 'Agregar', 'Adicionar'],
  'shop.empty': ['Liste vide', 'Empty list', 'Lista vacía', 'Lista vazia'],
  'shop.emptyText': ['Ajoutez des articles ici, depuis une recette, ou depuis la fiche d\'un produit en stock.', 'Add items here, from a recipe, or from a product in stock.', 'Agrega artículos aquí, desde una receta o desde la ficha de un producto del inventario.', 'Adicione itens aqui, a partir de uma receita ou da ficha de um produto do estoque.'],
  'shop.toBuy': ['À acheter', 'To buy', 'Por comprar', 'Para comprar'],
  'shop.cart': ['Dans le panier', 'In the cart', 'En el carrito', 'No carrinho'],
  'shop.emptyCart': ['Vider le panier', 'Empty the cart', 'Vaciar el carrito', 'Esvaziar o carrinho'],
  'shop.putAwayAll': ['Tout ranger dans le stock ({n})', 'Put everything in stock ({n})', 'Guardar todo en el inventario ({n})', 'Guardar tudo no estoque ({n})'],
  'shop.putAwayOne': ['Ranger dans le stock', 'Put in stock', 'Guardar en el inventario', 'Guardar no estoque'],
  'shop.putAwayHint': ['Chaque article retrouve sa place habituelle. Le bocal d\'un article le range seul, avec sa fiche.', 'Each item goes back to its usual place. An item\'s jar puts it away on its own, with its sheet.', 'Cada artículo vuelve a su lugar habitual. El frasco de un artículo lo guarda solo, con su ficha.', 'Cada item volta ao seu lugar de sempre. O pote de um item guarda só ele, com sua ficha.'],
  'shop.nToBuy': ['{n} à acheter', '{n} to buy', '{n} por comprar', '{n} para comprar'],
  'shop.nInCart': ['{n} dans le panier', '{n} in the cart', '{n} en el carrito', '{n} no carrinho'],
  'shop.left': ['Il en reste {n} {places}', '{n} left {places}', 'Quedan {n} {places}', 'Restam {n} {places}'],
  'shop.addedBy': ['Ajouté par {name}', 'Added by {name}', 'Agregado por {name}', 'Adicionado por {name}'],
  'shop.tick': ['Cocher {name}', 'Tick {name}', 'Marcar {name}', 'Marcar {name}'],
  'shop.untick': ['Décocher {name}', 'Untick {name}', 'Desmarcar {name}', 'Desmarcar {name}'],
  'shop.edit': ['Modifier {name}', 'Edit {name}', 'Editar {name}', 'Editar {name}'],
  'shop.putAwayItem': ['Ranger {name} dans le stock ({place})', 'Put {name} in stock ({place})', 'Guardar {name} en el inventario ({place})', 'Guardar {name} no estoque ({place})'],
  'shop.delete': ['Supprimer {name}', 'Delete {name}', 'Eliminar {name}', 'Excluir {name}'],
  'shop.deleted': ['{name} : supprimé', '{name}: deleted', '{name}: eliminado', '{name}: excluído'],
  'shop.needName': ['Indiquez l\'article à acheter (ex. 2 lait)', 'Enter the item to buy (e.g. 2 milk)', 'Escribe el artículo por comprar (ej. 2 leche)', 'Digite o item para comprar (ex. 2 leite)'],
  'shop.qtyUpdated': ['{name} : quantité mise à jour ({qty})', '{name}: quantity updated ({qty})', '{name}: cantidad actualizada ({qty})', '{name}: quantidade atualizada ({qty})'],
  'shop.addedInStock': ['{name} : ajouté. {left}, à vérifier avant d\'acheter.', '{name}: added. {left}, check before buying.', '{name}: agregado. {left}, revisa antes de comprar.', '{name}: adicionado. {left}, confira antes de comprar.'],
  'shop.already': ['Déjà dans la liste', 'Already on the list', 'Ya está en la lista', 'Já está na lista'],

  // Fiche d'un article
  'item.title': ['Article', 'Item', 'Artículo', 'Item'],
  'item.count': ['Nombre à acheter', 'How many to buy', 'Cantidad por comprar', 'Quantidade para comprar'],
  'item.noCount': ['Aucune', 'None', 'Ninguna', 'Nenhuma'],
  'item.bought': ['Acheté : ranger dans le stock', 'Bought: put it in stock', 'Comprado: guardar en el inventario', 'Comprado: guardar no estoque'],
  'item.remove': ['Supprimer de la liste', 'Remove from the list', 'Quitar de la lista', 'Remover da lista'],

  // « Tout ranger »
  'away.title': ['Ranger le panier', 'Put the cart away', 'Guardar el carrito', 'Guardar o carrinho'],
  'away.confirm': ['Ranger', 'Put away', 'Guardar', 'Guardar'],
  'away.hint': ['Vérifiez le rangement ; décochez ce qui ne va pas en stock.', 'Check where things go; untick what doesn\'t go in stock.', 'Revisa dónde va cada cosa; desmarca lo que no va al inventario.', 'Confira onde cada coisa vai; desmarque o que não vai para o estoque.'],
  'away.fridgeHint': ['Viande, poisson, charcuterie et traiteur au frigo : la date sera à compléter dans le stock (elle est sur l\'emballage). Les autres produits du frigo ont une date estimée (≈).', 'Meat, fish, deli meats and ready meals in the fridge: the date will need filling in from the stock (it\'s on the package). Other fridge products get an estimated date (≈).', 'Carne, pescado, embutidos y platos preparados en el refrigerador: la fecha se completa desde el inventario (está en el empaque). Los demás productos del refrigerador tienen una fecha estimada (≈).', 'Carne, peixe, frios e pratos prontos na geladeira: a data fica para completar no estoque (está na embalagem). Os outros produtos da geladeira têm uma data estimada (≈).'],
  'away.putN': [['Ranger {n} produit', 'Ranger {n} produits'], ['Put away {n} product', 'Put away {n} products'], ['Guardar {n} producto', 'Guardar {n} productos'], ['Guardar {n} produto', 'Guardar {n} produtos']],
  'away.line': ['Ranger {name}', 'Put away {name}', 'Guardar {name}', 'Guardar {name}'],
  'away.place': ['Lieu de rangement de {name}', 'Where {name} goes', 'Lugar de {name}', 'Local de {name}'],
  'away.unit': ['{price} l\'unité', '{price} each', '{price} c/u', '{price} cada'],
  'away.done': [['{n} produit rangé dans le stock', '{n} produits rangés dans le stock'], ['{n} product put in stock', '{n} products put in stock'], ['{n} producto guardado en el inventario', '{n} productos guardados en el inventario'], ['{n} produto guardado no estoque', '{n} produtos guardados no estoque']],
  'away.datesToFill': [' · dates à compléter : viande, poisson…', ' · dates to fill in: meat, fish…', ' · faltan fechas: carne, pescado…', ' · datas para completar: carne, peixe…']
};
