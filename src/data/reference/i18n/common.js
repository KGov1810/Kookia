// Kookia — Textes communs : barre d'onglets, menu +, synchronisation, erreurs, copier.
// Chaque texte : [français, anglais, espagnol (Amérique latine), portugais (Brésil)].

export const COMMON = {
  'tab.stock': ['Stock', 'Stock', 'Inventario', 'Estoque'],
  'tab.recipes': ['Recettes', 'Recipes', 'Recetas', 'Receitas'],
  'tab.shopping': ['Courses', 'Groceries', 'Compras', 'Compras'],
  'tab.stats': ['Stats', 'Stats', 'Cifras', 'Números'],
  'nav.label': ['Navigation principale', 'Main navigation', 'Navegación principal', 'Navegação principal'],
  'nav.add': ['Ajouter un produit', 'Add a product', 'Agregar un producto', 'Adicionar um produto'],
  'common.cancel': ['Annuler', 'Cancel', 'Cancelar', 'Cancelar'],
  'common.ok': ['OK', 'OK', 'OK', 'OK'],
  'common.close': ['Fermer', 'Close', 'Cerrar', 'Fechar'],
  'common.unit': ['Unité', 'Unit', 'Unidad', 'Unidade'],
  'common.edit': ['Modifier', 'Edit', 'Editar', 'Editar'],
  'common.copied': ['Copié', 'Copied', 'Copiado', 'Copiado'],
  'common.copyFailed': ['Copie impossible : sélectionnez le texte et copiez-le à la main.', 'Couldn\'t copy: select the text and copy it by hand.', 'No se pudo copiar: selecciona el texto y cópialo a mano.', 'Não foi possível copiar: selecione o texto e copie à mão.'],

  // Menu « + »
  'add.scan': ['Scanner un code-barres', 'Scan a barcode', 'Escanear un código de barras', 'Escanear um código de barras'],
  'add.scanHint': ['Nom et photo retrouvés automatiquement', 'Name and photo found automatically', 'Nombre y foto encontrados automáticamente', 'Nome e foto encontrados automaticamente'],
  'add.scanMany': ['Scanner plusieurs produits', 'Scan several products', 'Escanear varios productos', 'Escanear vários produtos'],
  'add.scanManyHint': ['Un bip par produit, vérification à la fin', 'One beep per product, check at the end', 'Un pitido por producto, revisión al final', 'Um bipe por produto, conferência no final'],
  'add.photo': ['Prendre le produit en photo', 'Take a photo of the product', 'Tomar una foto del producto', 'Tirar uma foto do produto'],
  'add.photoClaude': ['Claude reconnaît le produit et sa date', 'Claude recognizes the product and its date', 'Claude reconoce el producto y su fecha', 'O Claude reconhece o produto e a data'],
  'add.photoDate': ['Lecture de la date sur l\'emballage', 'Reads the date on the package', 'Lee la fecha en el empaque', 'Lê a data na embalagem'],
  'add.produce': ['Fruits et légumes', 'Fruit and vegetables', 'Frutas y verduras', 'Frutas e verduras'],
  'add.produceHint': ['Sans code-barres : choisissez dans la liste', 'No barcode: pick from the list', 'Sin código de barras: elige de la lista', 'Sem código de barras: escolha na lista'],
  'add.ticket': ['Scanner un ticket de caisse', 'Scan a receipt', 'Escanear un ticket de compra', 'Escanear um cupom fiscal'],
  'add.ticketHint': ['Tous les produits des courses d\'un coup', 'All your groceries at once', 'Todas las compras de una vez', 'Todas as compras de uma vez'],
  'add.needsKey': ['Nécessite une clé Claude (Réglages)', 'Needs a Claude key (Settings)', 'Requiere una clave de Claude (Ajustes)', 'Requer uma chave do Claude (Ajustes)'],
  'add.manual': ['Saisir à la main', 'Type it in', 'Escribir a mano', 'Digitar à mão'],

  // Synchronisation
  'sync.noFirebase': ['Firebase non configuré', 'Firebase not set up', 'Firebase sin configurar', 'Firebase não configurado'],
  'sync.noHousehold': ['Aucun foyer', 'No household', 'Sin hogar', 'Nenhuma casa'],
  'sync.error': ['Erreur de synchronisation', 'Sync error', 'Error de sincronización', 'Erro de sincronização'],
  'sync.offlinePending': ['Hors ligne, envoi en attente', 'Offline, changes waiting to send', 'Sin conexión, envío pendiente', 'Offline, envio pendente'],
  'sync.offline': ['Hors ligne', 'Offline', 'Sin conexión', 'Offline'],
  'sync.refreshing': ['Actualisation…', 'Refreshing…', 'Actualizando…', 'Atualizando…'],
  'sync.connecting': ['Connexion…', 'Connecting…', 'Conectando…', 'Conectando…'],
  'sync.sending': ['Envoi en cours…', 'Sending…', 'Enviando…', 'Enviando…'],
  'sync.ok': ['Synchronisé', 'Synced', 'Sincronizado', 'Sincronizado'],
  'sync.okWith': ['Synchronisé avec {name}', 'Synced with {name}', 'Sincronizado con {name}', 'Sincronizado com {name}'],

  // Erreurs Firebase
  'error.denied': ['Accès refusé par Firebase : vérifiez les règles Firestore (README, étape 1).', 'Firebase denied access: check the Firestore rules (README, step 1).', 'Firebase negó el acceso: revisa las reglas de Firestore (README, paso 1).', 'O Firebase negou o acesso: verifique as regras do Firestore (README, etapa 1).'],
  'error.unavailable': ['Pas de connexion : les modifications seront envoyées au retour du réseau.', 'No connection: changes will be sent when you\'re back online.', 'Sin conexión: los cambios se enviarán cuando vuelva la red.', 'Sem conexão: as alterações serão enviadas quando a rede voltar.'],
  'error.noDatabase': ['Base Firestore introuvable : créez-la dans la console Firebase (README, étape 1).', 'Firestore database not found: create it in the Firebase console (README, step 1).', 'No se encontró la base Firestore: créala en la consola de Firebase (README, paso 1).', 'Banco Firestore não encontrado: crie-o no console do Firebase (README, etapa 1).'],
  'error.anonymous': ['Activez la connexion « Anonyme » dans Firebase > Authentication (README, étape 1).', 'Turn on "Anonymous" sign-in in Firebase > Authentication (README, step 1).', 'Activa el acceso "Anónimo" en Firebase > Authentication (README, paso 1).', 'Ative o login "Anônimo" em Firebase > Authentication (README, etapa 1).'],
  'error.noAuth': ['Authentication n\'est pas activé dans la console Firebase (README, étape 1).', 'Authentication isn\'t enabled in the Firebase console (README, step 1).', 'Authentication no está activado en la consola de Firebase (README, paso 1).', 'O Authentication não está ativado no console do Firebase (README, etapa 1).'],
  'error.badConfig': ['Configuration Firebase invalide : recopiez-la depuis la console Firebase.', 'Invalid Firebase configuration: copy it again from the Firebase console.', 'Configuración de Firebase no válida: cópiala de nuevo desde la consola de Firebase.', 'Configuração do Firebase inválida: copie-a de novo do console do Firebase.'],
  'error.network': ['Pas de connexion internet.', 'No internet connection.', 'Sin conexión a internet.', 'Sem conexão com a internet.']
};
