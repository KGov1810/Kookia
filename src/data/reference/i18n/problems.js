// Kookia — Messages d'erreur : Claude, caméra et photos, Open Food Facts, foyer partagé.
// Chaque texte : [français, anglais, espagnol (Amérique latine), portugais (Brésil)].

export const PROBLEMS = {
  'claude.noKey': ['Ajoutez votre clé API Claude dans Réglages pour utiliser cette fonction.', 'Add your Claude API key in Settings to use this feature.', 'Agrega tu clave API de Claude en Ajustes para usar esta función.', 'Adicione sua chave de API do Claude em Ajustes para usar esta função.'],
  'claude.timeout': ['Claude met trop de temps à répondre, réessayez.', 'Claude is taking too long to answer, try again.', 'Claude tarda demasiado en responder, vuelve a intentarlo.', 'O Claude está demorando demais, tente de novo.'],
  'claude.offline': ['Connexion à Claude impossible : vérifiez la connexion internet.', 'Can\'t reach Claude: check your internet connection.', 'No se pudo conectar con Claude: revisa la conexión a internet.', 'Não foi possível falar com o Claude: confira a conexão com a internet.'],
  'claude.badKey': ['Clé API Claude refusée : vérifiez-la dans Réglages.', 'Claude API key rejected: check it in Settings.', 'Clave API de Claude rechazada: revísala en Ajustes.', 'Chave de API do Claude recusada: confira em Ajustes.'],
  'claude.tooMany': ['Trop de demandes envoyées à Claude, réessayez dans une minute.', 'Too many requests sent to Claude, try again in a minute.', 'Demasiadas solicitudes a Claude, vuelve a intentarlo en un minuto.', 'Pedidos demais ao Claude, tente de novo em um minuto.'],
  'claude.overloaded': ['Claude est surchargé pour le moment, réessayez un peu plus tard.', 'Claude is overloaded right now, try again a bit later.', 'Claude está saturado por ahora, vuelve a intentarlo más tarde.', 'O Claude está sobrecarregado agora, tente de novo mais tarde.'],
  'claude.noCredit': ['Crédit Claude épuisé : ajoutez du crédit sur console.anthropic.com.', 'Claude credit used up: add credit at console.anthropic.com.', 'Se acabó el crédito de Claude: agrega crédito en console.anthropic.com.', 'Crédito do Claude esgotado: adicione crédito em console.anthropic.com.'],
  'claude.error': ['Erreur Claude : {message}', 'Claude error: {message}', 'Error de Claude: {message}', 'Erro do Claude: {message}'],
  'claude.cut': ['La réponse de Claude a été coupée, réessayez.', 'Claude\'s answer was cut off, try again.', 'La respuesta de Claude se cortó, vuelve a intentarlo.', 'A resposta do Claude foi cortada, tente de novo.'],
  'claude.unexpected': ['Réponse inattendue de Claude, réessayez.', 'Unexpected answer from Claude, try again.', 'Respuesta inesperada de Claude, vuelve a intentarlo.', 'Resposta inesperada do Claude, tente de novo.'],

  'device.noCamera': ['Caméra non disponible dans ce navigateur.', 'Camera not available in this browser.', 'Cámara no disponible en este navegador.', 'Câmera indisponível neste navegador.'],
  'device.cameraUnavailable': ['Caméra indisponible.', 'Camera unavailable.', 'Cámara no disponible.', 'Câmera indisponível.'],
  'device.badPhoto': ['Photo illisible.', 'Unreadable photo.', 'Foto ilegible.', 'Foto ilegível.'],
  'device.noLibrary': ['Bibliothèque non téléchargée : vérifiez la connexion internet.', 'Library not downloaded: check your internet connection.', 'No se descargó la biblioteca: revisa la conexión a internet.', 'Biblioteca não baixada: confira a conexão com a internet.'],
  'off.unavailable': ['Open Food Facts indisponible ({status}).', 'Open Food Facts unavailable ({status}).', 'Open Food Facts no disponible ({status}).', 'Open Food Facts indisponível ({status}).'],

  'home.noConfig': ['Configuration Firebase manquante.', 'Firebase configuration missing.', 'Falta la configuración de Firebase.', 'Falta a configuração do Firebase.'],
  'home.noConfigInvite': ['Configuration Firebase manquante : collez le code d\'invitation complet.', 'Firebase configuration missing: paste the full invitation code.', 'Falta la configuración de Firebase: pega el código de invitación completo.', 'Falta a configuração do Firebase: cole o código de convite completo.'],
  'home.badCode': ['Code invalide : collez le code d\'invitation reçu (il commence par FRIGO1.).', 'Invalid code: paste the invitation code you received (it starts with FRIGO1.).', 'Código inválido: pega el código de invitación que recibiste (empieza por FRIGO1.).', 'Código inválido: cole o código de convite recebido (começa com FRIGO1.).'],
  'home.signIn': ['Connexion à Firebase impossible : vérifiez la connexion internet.', 'Can\'t connect to Firebase: check your internet connection.', 'No se pudo conectar con Firebase: revisa la conexión a internet.', 'Não foi possível conectar ao Firebase: confira a conexão com a internet.'],
  'home.silent': ['Firebase ne répond pas : vérifiez la connexion internet.', 'Firebase isn\'t answering: check your internet connection.', 'Firebase no responde: revisa la conexión a internet.', 'O Firebase não responde: confira a conexão com a internet.'],
  'home.notFound': ['Aucun foyer ne correspond à ce code. Vérifiez-le sur l\'autre iPhone (Réglages > Foyer partagé).', 'No household matches this code. Check it on the other iPhone (Settings > Shared household).', 'Ningún hogar coincide con este código. Revísalo en el otro iPhone (Ajustes > Hogar compartido).', 'Nenhuma casa corresponde a este código. Confira no outro iPhone (Ajustes > Casa compartilhada).']
};
