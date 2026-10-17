// Kookia — Textes de l'accueil (installation, connexion, foyer) et du chargement de l'app.
// Chaque texte : [français, anglais, espagnol (Amérique latine), portugais (Brésil)].
// <strong> est permis dans ces textes (affichés tels quels, ils ne viennent que de ce fichier).

export const ONBOARDING_TEXT = {
  'ob.pitch': ['Tout ce qu\'il y a à manger à la maison, partagé à deux : frigo, congélateur, placard, fruits et légumes. Moins d\'oublis, moins de gaspillage, et des recettes avec ce que vous avez.', 'Everything there is to eat at home, shared between two: fridge, freezer, cupboard, fruit and veg. Less forgetting, less waste, and recipes with what you have.', 'Todo lo que hay para comer en casa, compartido entre dos: refrigerador, congelador, alacena, frutas y verduras. Menos olvidos, menos desperdicio y recetas con lo que tienes.', 'Tudo o que tem para comer em casa, dividido entre duas pessoas: geladeira, freezer, armário, frutas e verduras. Menos esquecimento, menos desperdício e receitas com o que você tem.'],
  'ob.installTitle': ['Installez d\'abord l\'app', 'Install the app first', 'Primero instala la app', 'Instale o app primeiro'],
  'ob.install1': ['Touchez <strong>Partager</strong> {icon} dans la barre de Safari.', 'Tap <strong>Share</strong> {icon} in the Safari bar.', 'Toca <strong>Compartir</strong> {icon} en la barra de Safari.', 'Toque em <strong>Compartilhar</strong> {icon} na barra do Safari.'],
  'ob.install2': ['Choisissez <strong>Sur l\'écran d\'accueil</strong>, puis <strong>Ajouter</strong>.', 'Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.', 'Elige <strong>Agregar a inicio</strong> y luego <strong>Agregar</strong>.', 'Escolha <strong>Adicionar à Tela de Início</strong> e depois <strong>Adicionar</strong>.'],
  'ob.install3': ['Ouvrez <strong>Kookia</strong> depuis l\'écran d\'accueil pour continuer.', 'Open <strong>Kookia</strong> from the Home Screen to continue.', 'Abre <strong>Kookia</strong> desde la pantalla de inicio para continuar.', 'Abra o <strong>Kookia</strong> pela tela de início para continuar.'],
  'ob.installHint': ['L\'app installée garde ses propres données : faites la configuration depuis l\'écran d\'accueil, pas dans Safari.', 'The installed app keeps its own data: set it up from the Home Screen, not in Safari.', 'La app instalada guarda sus propios datos: configúrala desde la pantalla de inicio, no en Safari.', 'O app instalado guarda seus próprios dados: configure pela tela de início, não no Safari.'],
  'ob.inSafari': ['Continuer dans Safari quand même', 'Continue in Safari anyway', 'Seguir en Safari de todos modos', 'Continuar no Safari mesmo assim'],
  'ob.connectTitle': ['Connexion', 'Connection', 'Conexión', 'Conexão'],
  'ob.connectHint': ['Le partage entre les deux iPhone passe par votre base Firebase gratuite.', 'Sharing between the two iPhones goes through your free Firebase database.', 'Compartir entre los dos iPhone pasa por tu base de Firebase gratuita.', 'O compartilhamento entre os dois iPhones passa pela sua base gratuita do Firebase.'],
  'ob.connectLabel': ['<strong>Second iPhone</strong> : collez le code d\'invitation reçu.<br><strong>Premier iPhone</strong> : collez la configuration Firebase (README, étape 1).', '<strong>Second iPhone</strong>: paste the invitation code you received.<br><strong>First iPhone</strong>: paste the Firebase configuration (README, step 1).', '<strong>Segundo iPhone</strong>: pega el código de invitación que recibiste.<br><strong>Primer iPhone</strong>: pega la configuración de Firebase (README, paso 1).', '<strong>Segundo iPhone</strong>: cole o código de convite recebido.<br><strong>Primeiro iPhone</strong>: cole a configuração do Firebase (README, etapa 1).'],
  'ob.continue': ['Continuer', 'Continue', 'Continuar', 'Continuar'],
  'ob.notRecognized': ['Texte non reconnu. Collez le code d\'invitation (il commence par FRIGO1.) ou le bloc de configuration Firebase complet.', 'Text not recognized. Paste the invitation code (it starts with FRIGO1.) or the full Firebase configuration block.', 'Texto no reconocido. Pega el código de invitación (empieza por FRIGO1.) o el bloque completo de configuración de Firebase.', 'Texto não reconhecido. Cole o código de convite (começa com FRIGO1.) ou o bloco completo de configuração do Firebase.'],
  'ob.householdTitle': ['Votre foyer', 'Your household', 'Tu hogar', 'Sua casa'],
  'ob.firstName': ['Votre prénom', 'Your first name', 'Tu nombre', 'Seu nome'],
  'ob.firstNamePlaceholder': ['Prénom', 'First name', 'Nombre', 'Nome'],
  'ob.needName': ['Indiquez votre prénom.', 'Enter your first name.', 'Escribe tu nombre.', 'Digite seu nome.'],
  'ob.needCode': ['Collez le code d\'invitation reçu de l\'autre iPhone.', 'Paste the invitation code received from the other iPhone.', 'Pega el código de invitación que recibiste del otro iPhone.', 'Cole o código de convite recebido do outro iPhone.'],
  'ob.inviteFound': ['Invitation reconnue. Touchez « Rejoindre » pour retrouver le stock partagé du foyer.', 'Invitation recognized. Tap "Join" to get the household\'s shared stock.', 'Invitación reconocida. Toca "Unirse" para ver el inventario compartido del hogar.', 'Convite reconhecido. Toque em "Entrar" para ver o estoque compartilhado da casa.'],
  'ob.connecting': ['Connexion…', 'Connecting…', 'Conectando…', 'Conectando…'],
  'ob.join': ['Rejoindre le foyer', 'Join the household', 'Unirse al hogar', 'Entrar na casa'],
  'ob.first': ['Premier iPhone', 'First iPhone', 'Primer iPhone', 'Primeiro iPhone'],
  'ob.create': ['Créer un foyer', 'Create a household', 'Crear un hogar', 'Criar uma casa'],
  'ob.second': ['Second iPhone', 'Second iPhone', 'Segundo iPhone', 'Segundo iPhone'],
  'ob.codeReceived': ['Code d\'invitation reçu', 'Invitation code received', 'Código de invitación recibido', 'Código de convite recebido'],
  'ob.createdTitle': ['Foyer créé', 'Household created', 'Hogar creado', 'Casa criada'],
  'ob.createdText': ['Sur le second iPhone, installez l\'app puis collez ce code d\'invitation.', 'On the second iPhone, install the app and paste this invitation code.', 'En el segundo iPhone, instala la app y pega este código de invitación.', 'No segundo iPhone, instale o app e cole este código de convite.'],
  'ob.send': ['Envoyer', 'Send', 'Enviar', 'Enviar'],
  'ob.copy': ['Copier', 'Copy', 'Copiar', 'Copiar'],
  'ob.codeHint': ['Code du foyer : {code}. L\'invitation reste disponible dans Réglages > Foyer partagé.', 'Household code: {code}. The invitation stays available in Settings > Shared household.', 'Código del hogar: {code}. La invitación sigue disponible en Ajustes > Hogar compartido.', 'Código da casa: {code}. O convite continua disponível em Ajustes > Casa compartilhada.'],
  'ob.start': ['Commencer', 'Get started', 'Empezar', 'Começar']
};
