# Kookia

Le stock de nourriture de la maison, partagé à deux : **frigo, congélateur, placard, fruits et légumes**. Application installée sur l'écran d'accueil de chaque iPhone depuis Safari. **Elle n'expire jamais** et ne demande ni Mac ni compte développeur Apple.

- **Tout le stock** : chaque produit a un lieu (Frigo, Congélateur, Placard, Fruits & légumes) et une date adaptée. Date limite (DLC) ou « de préférence » (DDM) imprimée, date estimée pour les fruits et légumes, durée conseillée pour ce qu'on congèle, et simple ancienneté (« au placard depuis 8 mois ») pour les produits secs sans date.
- **Ajout de produits** : scan du code-barres (base Open Food Facts), photo analysée par Claude, **ticket de caisse** (toutes les courses d'un coup, chaque produit rangé à sa place), **grille de fruits et légumes** sans code-barres, lecture de la date sur l'emballage, ou saisie manuelle.
- **Historique** : qui a ajouté, modifié, consommé ou supprimé quoi, et quand, sur 90 jours (stock, courses, recettes).
- **Anti-oubli, anti-achat en double** : bouton *Congeler* pour sauver un produit qui va périmer, section « Oubliés depuis longtemps », et avertissement « déjà en stock » dans la liste de courses.
- **Alertes** : les produits à consommer vite sont mis en avant à chaque ouverture, avec une pastille sur l'icône (voir les limites plus bas).
- **Recettes** : l'app montre d'abord vos recettes déjà enregistrées réalisables avec le stock actuel (gratuit). Sinon, Claude en propose 5 nouvelles qui utilisent d'abord les produits qui vont périmer et ceux oubliés depuis longtemps, complétés par le reste du stock et la liste de courses. Filtres : nombre de personnes, végétarien ou vegan, **origine** (cuisines du monde, envie libre comme « nouilles » ou « couscous »), léger, difficulté, temps total, batch cooking. Calories estimées par portion, quantités recalculables selon le nombre de portions.
- **Recettes toujours à jour** : un produit racheté est reconnu dans les anciennes recettes grâce à son code-barres (ou, à défaut, à son nom).
- **Produits consommés ou jetés** : le rond à gauche de chaque produit, la fiche du produit (*Consommé* ou *Jeté*, en choisissant combien), ou « J'ai cuisiné cette recette ».
- **Prix et statistiques** : un prix facultatif par produit, relevé automatiquement sur les tickets de caisse. L'onglet **Stats** montre la valeur du stock actuel, puis ce qui a été dépensé, consommé et jeté, mois par mois et par catégorie, avec des filtres (rayon, catégorie, lieu, personne).
- **Partage en temps réel** entre les deux iPhone (stock, liste de courses, recettes et statistiques), via une base Firebase gratuite. Fonctionne aussi hors ligne.

Tout est gratuit, sauf les fonctions Claude (facultatives, quelques centimes par usage).

---

## Ce qu'il faut

- Un **compte Google** (pour Firebase) et un **compte GitHub** (pour héberger l'app), tous deux gratuits.
- Un ordinateur (Windows convient) avec **git** (ou l'application GitHub Desktop) pour envoyer le code sur GitHub. Node.js n'est pas nécessaire : c'est GitHub qui teste et construit l'app.
- iOS 16.4 ou plus récent sur les deux iPhone.

Comptez environ 25 minutes, une seule fois.

---

## Étape 1 — Créer la base Firebase (≈ 10 min)

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com) → **Créer un projet** (nom libre, ex. « frigo-partage »). Google Analytics est inutile : désactivez-le.
2. Sur la page du projet, cliquez sur l'icône **Web** `</>` (« Ajouter une application »). Donnez un surnom (ex. « frigo »), **ne cochez pas** Firebase Hosting, puis **Enregistrer**.
3. Firebase affiche un bloc qui commence par `const firebaseConfig = {`. **Copiez tout ce bloc** et gardez-le (dans Notes, par exemple). Vous le collerez dans l'app à l'étape 3.
4. Menu **Créer → Authentication** → *Commencer* → onglet *Mode de connexion* → **Anonyme** → *Activer* → *Enregistrer*.
5. Menu **Créer → Firestore Database** → *Créer une base de données* → emplacement `eur3 (europe-west)` → **mode production** → *Créer*.
6. Onglet **Règles** de Firestore : effacez tout, collez le contenu du fichier `firestore.rules` fourni, puis **Publier**.

L'offre gratuite « Spark » suffit largement et ne demande aucune carte bancaire.

## Étape 2 — Mettre l'app en ligne avec GitHub Pages (≈ 10 min)

1. Créez un compte sur [github.com](https://github.com) si besoin.
2. En haut à droite : **+** → **New repository**. Nom : `frigo`. Laissez **Public** (obligatoire pour GitHub Pages gratuit). Cliquez **Create repository**.
3. Envoyez le contenu du dossier `kookia` (pas le dossier lui-même) dans ce dépôt, avec git : `git init`, `git add .`, `git commit -m "Kookia"`, puis les commandes `git remote add` et `git push` que GitHub affiche. Avec GitHub Desktop : *Add an Existing Repository*, puis *Publish*.
4. Onglet **Settings** → **Pages** (menu de gauche) → *Source* : **GitHub Actions**.
5. Onglet **Actions** : la tâche « Tests et mise en ligne » se lance (2 à 3 minutes). Quand elle est verte, l'adresse de l'app apparaît dans **Settings → Pages**, du type `https://votre-pseudo.github.io/frigo/`. Si elle ne s'est pas lancée, ouvrez-la et touchez **Run workflow**.

Aucun secret n'est publié : la configuration Firebase n'est saisie que dans l'app, et vos données sont protégées par le code du foyer.

## Étape 3 — Installer sur le premier iPhone

1. Ouvrez l'adresse de l'étape 2 dans **Safari**.
2. Touchez **Partager** (carré avec une flèche) → **Sur l'écran d'accueil** → **Ajouter**.
3. Ouvrez **Kookia** depuis l'écran d'accueil (pas depuis Safari : l'app installée garde ses propres données).
4. Collez le bloc `firebaseConfig` copié à l'étape 1.3 → **Continuer**.
5. Saisissez votre prénom → **Créer un foyer**.
6. Touchez **Envoyer** pour transmettre l'invitation à l'autre personne (Messages, WhatsApp, e-mail…), puis **Commencer**.

## Étape 4 — Installer sur le second iPhone

1. Ouvrez le lien contenu dans l'invitation reçue, dans **Safari**.
2. **Partager** → **Sur l'écran d'accueil** → **Ajouter**, puis ouvrez l'app depuis l'écran d'accueil.
3. Collez **le message d'invitation entier** (l'app retrouve toute seule le code `FRIGO1.…`) → **Continuer**.
4. Saisissez votre prénom → **Rejoindre le foyer**. Le frigo partagé apparaît aussitôt.

Gardez l'invitation quelque part (Notes) : elle permet de réinstaller l'app si elle est supprimée de l'écran d'accueil. Elle reste aussi disponible dans **Réglages → Foyer partagé**.

## Étape 5 — Clé Claude (facultatif, sur chaque iPhone)

1. Créez une clé sur [console.anthropic.com](https://console.anthropic.com) et ajoutez quelques euros de crédit.
2. Dans l'app : **Réglages → Recettes et photos** → collez la clé → **Enregistrer la clé**.

La clé reste sur l'iPhone où elle est saisie. Comptez quelques centimes pour 5 recettes, moins d'un centime par photo. Sans clé, le code-barres, la lecture de date (moins précise) et la saisie manuelle fonctionnent quand même, mais pas les recettes.

## Étape 6 — Rappel quotidien et pastille (recommandé)

Une application web ne peut pas envoyer de notification quand elle est fermée. Pour compenser :

- **Rappel quotidien** : dans l'app **Rappels** d'iOS, créez un rappel « Vérifier le frigo », avec une date, une heure (ex. 18 h) et **Répéter : tous les jours**. Chaque jour, ouvrez Frigo : les produits à consommer vite sont en haut, avec un bouton vers les recettes.
- **Pastille sur l'icône** : dans l'app, **Réglages → Alertes** → *Afficher sur l'icône le nombre de produits à consommer* → **Autoriser**. La pastille se met à jour à chaque ouverture de l'app.

Le nombre de jours de prévenance (0 à 7, 2 par défaut) se règle dans **Réglages → Alertes**.

---

## Utilisation au quotidien

- **Stock** : l'onglet affiche tout ; les boutons *Frigo*, *Congélateur*, *Placard*, *Fruits & légumes* filtrent par lieu (avec le nombre de produits). Sections : *Date à compléter*, *Périmés* (date limite dépassée uniquement), *À consommer vite*, *Oubliés depuis longtemps* (au placard depuis plus de 6 mois), *En stock*.
- **Ajouter** : bouton **+** → *Scanner un code-barres*, *Prendre le produit en photo*, *Fruits et légumes*, *Scanner un ticket de caisse* ou *Saisir à la main*. Dans la fiche, choisissez le **rangement**, puis le **type de date** proposé pour ce lieu :
  - *Frigo* : date limite (DLC), « de préférence » (DDM) ou estimée ;
  - *Congélateur* : « congelé le … » (durée conseillée selon la catégorie : 6 mois pour la viande, 4 pour le poisson, 12 pour les légumes…) ou date imprimée sur l'emballage ;
  - *Placard* : sans date (l'app suit l'ancienneté) ou date « de préférence » imprimée ;
  - *Fruits & légumes* : date estimée selon le produit (bananes ≈ 5 jours, pommes de terre ≈ 45 jours…), modifiable.

  **Lire la date** photographie la date de près. **Vérifiez toujours la date proposée.** Un surgelé scanné va directement au congélateur, un paquet de riz au placard.
- **Catégories** : 23 catégories rangées par rayon. *Frais* : fruits, légumes, viande, volaille, charcuterie, poisson et fruits de mer, œufs, produits laitiers, fromages, traiteur, pain et viennoiseries. *Épicerie* : pâtes, riz et céréales ; légumineuses ; conserves ; sauces, condiments et épices ; farine, sucre et pâtisserie ; biscuits, chocolat et petit-déjeuner ; apéritif et snacks ; fruits secs et graines ; épicerie (autre). Puis *boissons*, *surgelés et glaces*, *autre*. En tapant le nom d'un produit, l'app propose sa catégorie (« Lentilles » → légumineuses), son lieu habituel et, pour un fruit ou un légume, une date estimée ; vous pouvez toujours changer. La recherche fonctionne aussi par catégorie (« fromages », « conserves »…).
- **Fruits et légumes sans code-barres** : **+** → *Fruits et légumes*. Touchez ce que vous avez acheté (plusieurs fois pour en ajouter plusieurs), ou tapez un nom absent de la liste, puis **Ajouter**. Chaque produit va à sa place habituelle avec une date estimée.
- **Choisir combien** : dans la fiche d'un produit en plusieurs exemplaires, *Congeler*, *Consommé* et *Jeté* ouvrent un petit cadre « Combien ? ». Le compteur démarre à 1 (− et + pour ajuster, ou **Tout** pour tout prendre), puis *Congeler 2*, *Consommer 2* ou *Jeter 2*. Avec un seul exemplaire, le bouton agit tout de suite. **Annuler** reste possible quelques secondes après.
- **Congeler** : dans la fiche d'un produit du frigo qui va périmer, *Congeler* le passe au congélateur avec une durée conseillée. Si vous n'en congelez qu'une partie (3 steaks sur 8), ceux-là deviennent une ligne à part au congélateur et le reste ne bouge pas. Congeler ne compte ni comme un achat ni comme une consommation dans les statistiques.
- **Nombre et poids** : dans la fiche, **Nombre** (boutons − et +) indique combien d'unités vous avez, **Poids ou contenance** la taille de chacune. Deux sachets de 2 kg de pommes de terre : nombre 2, poids « 2 kg », affiché « 2 × 2 kg » avec une pastille ×2. Un pack scanné « 4 x 125 g » est compris comme 4 pots de 125 g.
- **Scanner un produit déjà en stock** : l'app le signale et propose de l'ajouter au produit existant (même date de péremption) plutôt que d'en créer un second.
- **Ticket de caisse** : **+** → *Scanner un ticket de caisse*. Photographiez le ticket (plusieurs photos de haut en bas s'il est long, ou une capture de commande en ligne) → **Lire le ticket**. Vérifiez la liste : corrigez un nom, le nombre, le poids, le **prix** (montant de la ligne, toutes unités comprises) ou le **lieu** proposé, décochez ce qui ne va pas en stock, puis **Ajouter**. Le total des prix lus est affiché pour le comparer au ticket (les produits non alimentaires n'y sont pas). Placard, congélateur, fruits et légumes n'ont pas besoin de date ; les produits du frigo arrivent dans la section **Date à compléter** (compteur « ? ») : touchez-les pour indiquer la date, ou « Lire la date » pour la photographier. Les articles de la liste de courses retrouvés sur le ticket en sont retirés. Nécessite une clé Claude.
- **Consommé** : touchez le rond à gauche d'un produit. S'il y en a plusieurs, une seule unité est retirée (« il en reste 1 ») ; le produit disparaît à la dernière. Un bouton **Annuler** apparaît quelques secondes. Pour en retirer plusieurs, ou tout : fiche du produit → *Consommé : retirer du stock*, puis choisissez combien.
- **Jeté** : fiche du produit → *Jeté : retirer du stock*. S'il y en a plusieurs, choisissez combien partent à la poubelle, puis **Jeter**. Le rond de la liste veut toujours dire « consommé ».
- **Prix** : dans la fiche, *Prix à l'unité* est facultatif (« 2,49 » ou « 2.49 »). Pour plusieurs unités, le total s'affiche dessous (« Soit 4,98 € pour 2 »). Quand vous ajoutez un produit déjà acheté (même code-barres ou même nom), le dernier prix payé est proposé : vérifiez-le. Les fruits et légumes de la grille reprennent eux aussi le dernier prix connu, modifiable ensuite dans leur fiche. Avec un ticket de caisse, les prix sont remplis tout seuls.
- **Valeur du stock** : en haut de l'onglet **Stats**, ce que vaut le stock en ce moment, avec le détail par lieu (frigo, congélateur, placard, fruits et légumes) et le montant **à consommer vite** (touchez-le pour ouvrir le stock). Cette carte ne dépend ni de la période ni des filtres. Les produits sans prix n'y sont pas comptés : leur nombre est indiqué.
- **Stats** : sous « Sur la période », l'onglet montre, pour la période choisie (*Ce mois*, *3 mois*, *12 mois* par défaut, *Tout*), ce qui a été **dépensé** (achats), **consommé** et **jeté**, ainsi que la part jetée de ce qui est sorti du stock. En dessous : un graphique **mois par mois** (touchez un mois pour voir ses montants), les **dépenses par catégorie** (touchez une ligne pour filtrer sur cette catégorie) et les **produits les plus jetés**. Les pastilles en haut filtrent par rayon ou catégorie, par lieu et par personne. Les produits sans prix ne sont pas comptés : l'écran indique combien il y en a.
- **Racheter** : dans la fiche d'un produit, *Ajouter à la liste de courses*.
- **Recettes** : choisissez **pour combien de personnes** (choix mémorisé), et si besoin **Végétarien**, **Vegan** ou **Léger** (500 kcal maximum par portion, seuil réglable dans Réglages → Recettes). **Origine** ouvre un sélecteur : cochez une ou plusieurs cuisines (italienne, japonaise, maghrébine…, ou *Tour du monde* pour varier), et/ou décrivez votre envie dans « Envie de… ». Avec une origine ou une envie, Claude peut prévoir jusqu'à 6 ingrédients à acheter par recette pour rester fidèle à l'originale (2 sinon). Les produits à consommer vite sont présélectionnés (*Choisir les produits* pour changer). La section **Déjà dans vos recettes** liste les recettes enregistrées réalisables avec le stock actuel (au plus deux ingrédients à se procurer), celles qui utilisent les produits à consommer vite en premier. Si aucune ne convient, **Proposer 5 nouvelles recettes**. Dans une recette : ajouter aux courses ce qui manque, favori (étoile), partager, **J'ai cuisiné cette recette** (retire une unité de chaque produit utilisé).
- **Dans une recette**, les boutons **Portions** − et + recalculent les quantités (les temps de cuisson restent indicatifs) ; « ajouter aux courses » et « partager » suivent ce nombre. Les calories sont une **estimation** de Claude par portion.
- Chaque ingrédient indique où il se trouve : *Au frigo*, *Au placard*, *Au congélateur*… (le produit d'origine), avec *(même code-barres)* pour un produit racheté ou *(produit similaire)* s'il est retrouvé par son nom (à vérifier), sinon *Sur la liste de courses* ou *À acheter*. Pour profiter du rapprochement par code-barres, ajoutez vos produits en les scannant.
- **Historique** : bouton horloge en haut de l'écran Stock (accès uniquement depuis cet écran). Les actions sont groupées par jour, les plus récentes en premier, avec le prénom, l'heure et le détail des modifications (« Nombre : 2 → 3 », « Lieu : Frigo → Congélateur »). Filtres par type (Stock, Courses, Recettes) et par personne. Cocher ou décocher un article de courses n'est pas noté. Les entrées de plus de 90 jours sont supprimées automatiquement. C'est une consultation : on ne restaure rien depuis l'historique.
- **Courses** : tapez l'article et, si besoin, le **nombre** à acheter dans « Qté » (chiffres uniquement). Pour préciser un poids, écrivez-le avec l'article : « Farine 1 kg ». Les ingrédients ajoutés depuis une recette suivent la même règle (« Pâtes (400 g) »). Touchez le rond pour cocher, touchez le nom pour modifier. Ajouter un article déjà présent avec un nouveau nombre met simplement sa quantité à jour. Si l'article est déjà en stock, l'app l'indique (« En stock : 1 au placard ») pour éviter d'acheter en double. Une fois acheté, l'icône bocal le range dans le stock : « Farine 1 kg », nombre 2, devient nombre 2 et poids « 1 kg ».

## Passer de « Frigo partagé » à Kookia

Après la mise à jour sur GitHub (voir « Mettre à jour l'app »), l'app ouverte affiche déjà Kookia : vos produits passent automatiquement dans « Frigo », rien n'est perdu.

L'iPhone garde cependant **l'ancien nom et l'ancienne icône** sur l'écran d'accueil. Pour les remplacer (facultatif), sur chaque iPhone :

1. Dans l'app : **Réglages → Foyer partagé → Copier le code d'invitation**, et gardez-le dans Notes.
2. Vérifiez que vous avez votre **clé Claude** quelque part. Elle ne peut plus être affichée en entier ; sinon, créez-en une nouvelle sur console.anthropic.com (une minute).
3. Supprimez l'ancienne icône de l'écran d'accueil (appui long → *Supprimer l'app*).
4. Ouvrez la même adresse dans Safari → **Partager → Sur l'écran d'accueil**, puis ouvrez Kookia.
5. Collez l'invitation, saisissez votre prénom, **Rejoindre le foyer**, puis recollez la clé Claude dans Réglages.

Le stock, les courses et les recettes, partagés dans Firebase, sont retrouvés tels quels. Gardez la **même adresse GitHub** : en changer créerait une app vide.

## Passer à la version 2 (nouvelle organisation du code)

La version 2 range le code dans des dossiers et le fait tester puis construire par GitHub à chaque envoi. Rien ne change dans l'app ni dans vos données. Une seule fois :

1. Dans votre dépôt, **supprimez les anciens fichiers** : `app.js`, `services.js`, `store.js`, `ui.js`, `styles.css`, `sw.js`, `icon-*.png`, `manifest.json`, `config.js` et `.nojekyll`. Avec git, le plus simple est de vider le dossier du dépôt (sauf le dossier caché `.git`), d'y copier le contenu du nouveau dossier `kookia`, puis `git add -A`, `git commit` et `git push`.
2. **Settings → Pages → Source : GitHub Actions** (au lieu de *Deploy from a branch*).
3. Onglet **Actions** : attendez que « Tests et mise en ligne » soit vert.
4. Sur chaque iPhone, fermez complètement l'app et rouvrez-la. Pas besoin de la réinstaller : l'adresse est la même.

Si vous avez déjà publié les règles Firebase de la version avec l'historique, il n'y a rien à changer dans Firebase.

## Mettre à jour l'app

1. Remplacez les fichiers du dépôt par ceux de la nouvelle version, puis `git add -A`, `git commit` et `git push`.
2. GitHub lance automatiquement **les tests puis la mise en ligne** (onglet **Actions**, 2 à 3 minutes). Si un test échoue, la tâche devient rouge et **rien n'est mis en ligne** : les iPhone gardent la version précédente, qui fonctionne. Ouvrez la tâche rouge pour lire quel test a échoué.
3. Quand elle est verte, fermez complètement l'app sur chaque iPhone (balayez-la vers le haut dans le sélecteur d'apps) et rouvrez-la. Si l'ancienne version s'affiche encore, recommencez une fois.

Aucune donnée n'est perdue : ni le stock, ni les recettes, ni la clé Claude.

> **Version avec les prix et les statistiques : règles Firebase à recoller.** Collez le nouveau fichier `firestore.rules` dans Firebase → Firestore Database → onglet **Règles** → **Publier**. Il autorise deux nouvelles collections : `mouvements` (achats, consommations et produits jetés, lisibles, ajoutés ou effacés par « Annuler », jamais modifiés) et `prix` (le dernier prix payé par produit). Tant que ce n'est pas fait, l'app fonctionne normalement, mais rien n'est noté pour les statistiques et l'onglet Stats l'explique.

> Si une version demande de mettre à jour les règles Firebase (c'est indiqué dans ses notes), collez le nouveau fichier `firestore.rules` dans Firebase → Firestore Database → onglet **Règles** → **Publier**.

## Limites connues

- **Pas de notification quand l'app est fermée** (limite des applications web sans serveur) : voir l'étape 6. Une vraie notification quotidienne serait possible plus tard, avec une petite automatisation gratuite sur GitHub, au prix d'une configuration plus technique.
- **Scanner** : un peu moins rapide que l'appareil photo natif. Visez bien, avec de la lumière, le code à l'horizontale dans le cadre. À défaut : *Photographier le code-barres* ou taper les chiffres.
- **Rapprochement par le nom** : utile mais pas infaillible (« Pommes » peut retrouver « Pommes de terre »). Il est signalé *produit similaire* ; la confirmation de « J'ai cuisiné » liste les produits retirés.
- **Synchronisation après une pause** : quand l'app revient au premier plan, elle rétablit sa connexion (« Actualisation… » pendant une seconde). Si l'autre iPhone a fait une modification alors qu'il était hors ligne, elle n'arrive qu'une fois qu'il a retrouvé le réseau et été rouvert.
- **Lecture de date sans Claude** : l'outil gratuit (téléchargé au premier usage, quelques Mo) est fiable sur les dates bien imprimées, beaucoup moins sur les dates embossées ou au jet d'encre. Avec une clé Claude, c'est Claude qui lit la date, bien plus fiable.
- **Open Food Facts** : base collaborative, certains produits sont absents ou incomplets.
- **Historique** : il est écrit par les iPhone eux-mêmes. Un iPhone pas encore mis à jour ne note rien, et le prénom affiché est celui saisi dans les Réglages (pas un compte vérifié). Les modifications faites directement dans la console Firebase n'y figurent pas.
- **Dates estimées** : celles des fruits et légumes et des produits congelés sont des repères, pas des dates de péremption. L'app les marque d'un « ≈ » et ne les affiche jamais en « Périmés » : vérifiez l'aspect et l'odeur.
- **Catégories proposées** : la proposition d'après le nom repose sur une liste de mots courants ; elle peut se tromper ou ne rien proposer pour un produit original. Les produits enregistrés avant l'arrivée des catégories détaillées ont été reclassés automatiquement d'après leur nom ; vérifiez-en quelques-uns.
- **Produits secs** : la section « Oubliés depuis longtemps » se base sur la date d'ajout dans l'app, pas sur la date d'achat réelle des produits déjà présents avant.
- **Calories** : estimation de Claude, à environ 20 % près. Les recettes créées avant cette fonction n'ont ni calories ni régime : elles sont masquées quand un filtre Végétarien, Vegan, Léger ou une cuisine est choisi (l'« Envie de… », elle, cherche dans le titre et les ingrédients de toutes les recettes).
- **Statistiques** : elles commencent à la mise à jour ; les achats et consommations d'avant ne sont pas connus, et les produits déjà en stock n'ont pas de prix (ajoutez-le dans leur fiche si vous voulez qu'ils comptent). Les mouvements sont gardés sans limite de durée. Ils sont écrits par les iPhone eux-mêmes : un iPhone pas encore mis à jour ne note rien. Changer le nombre à la main dans la fiche est une correction, pas un achat ni une consommation. Un produit ajouté par erreur puis retiré compte comme acheté puis consommé ou jeté.
- **Prix** : un prix par produit, celui de la dernière fois. Si vous ajoutez des unités à un produit existant avec un autre prix, c'est le nouveau prix qui compte pour tout le produit. Les prix lus sur un ticket peuvent comporter des erreurs (remises, produits au poids) : vérifiez-les avant d'ajouter. Le choix *Tout* lit tous les mouvements depuis le début : sans conséquence pour un foyer, l'offre gratuite de Firebase le permet largement.
- **Ticket de caisse** : pas de date de péremption sur un ticket, ni de code-barres (le rapprochement avec les anciennes recettes se fait alors par le nom). La photo est envoyée à Claude pour être lue (environ 1 à 3 centimes) ; elle peut contenir le nom du magasin et les derniers chiffres de la carte bancaire, et n'est pas conservée dans l'app.
- **DLC ou DDM** : l'app ne fait pas la différence. Claude a pour consigne de ne jamais utiliser un produit frais (viande, poisson, laitier, traiteur) dont la date est dépassée.
- **Sécurité** : toute personne qui possède l'invitation peut voir et modifier vos données. Ne la partagez qu'avec l'autre utilisateur.
- **Une app par iPhone** : la version ouverte dans Safari et celle de l'écran d'accueil ne partagent pas leurs réglages. Utilisez toujours celle de l'écran d'accueil.

## Dépannage

| Message ou symptôme | Solution |
|---|---|
| « Texte non reconnu » à la connexion | Collez le bloc `firebaseConfig` complet (étape 1.3), ou le message d'invitation entier. |
| « Activez la connexion Anonyme… » | Étape 1.4. |
| « Authentication n'est pas activé » | Étape 1.4 : cliquez d'abord sur *Commencer*. |
| « Base Firestore introuvable » | Étape 1.5. |
| « Accès refusé par Firebase » | Règles non publiées : étape 1.6. |
| « L'historique n'est pas encore autorisé » | Recollez le fichier `firestore.rules` dans Firebase → Firestore → Règles → **Publier**. |
| « Les statistiques ne sont pas encore autorisées » | Même chose : recollez le fichier `firestore.rules` à jour, **Publier**, puis fermez et rouvrez l'app. |
| « Aucun foyer ne correspond à ce code » | Renvoyez l'invitation depuis le premier iPhone (Réglages → Foyer partagé). |
| Page GitHub « 404 » | Attendez deux minutes après l'étape 2.5 ; vérifiez que `index.html` est à la racine du dépôt, pas dans un sous-dossier. |
| « Accès à la caméra refusé » | Réglages de l'iPhone → Safari → Caméra → Autoriser (ou Demander), puis « Réessayer ». |
| Écran noir ou « La caméra ne s'affiche pas » dans le scanner | Touchez **Démarrer la caméra**, puis **Réessayer**. Si l'image reste noire : fermez complètement l'app (balayez-la vers le haut) et rouvrez-la ; vérifiez aussi qu'aucune autre app (appel vidéo, appareil photo) n'utilise la caméra. En attendant : **Photographier le code-barres** ou tapez les chiffres. |
| Une modification de l'autre iPhone n'apparaît pas | Réglages → **Se reconnecter**. Vérifiez que l'autre iPhone a du réseau et que l'app y a été rouverte (l'indication sous le titre doit être « Synchronisé », pas « Envoi en cours… »). |
| « Crédit Claude épuisé » | Ajoutez du crédit sur console.anthropic.com. |
| L'app affiche une ancienne version | Fermez-la complètement (glisser vers le haut dans le sélecteur d'apps) et rouvrez-la. |

**Autre hébergement possible** : [Netlify Drop](https://app.netlify.com/drop) (glisser le dossier dans la page, puis créer un compte gratuit pour garder le site en ligne).

## Architecture

Le code est organisé par couche technique. Chaque couche n'utilise que celles situées en dessous d'elle ; un test vérifie cette règle à chaque envoi, ainsi qu'une taille maximale de 200 lignes par fichier.

```
index.html                 Page d'entrée (Vite)
src/
  main.js                  Démarrage
  views/                   Écrans et fiches : un dossier par écran
    app/                   Navigation, barre d'onglets, actions, événements
    stock/  product-editor/  scanner/  produce/  receipt/
    recipes/  shopping/  stats/  settings/  onboarding/  history/
  components/              Éléments d'affichage réutilisables (fiches, icônes, gabarits…)
  data/
    store/                 État partagé, Firebase, synchronisation, historique,
                           mouvements (statistiques) et mémoire des prix
    reference/             Données fixes : catégories, lieux, fruits et légumes, cuisines
  services/                Règles métier (dates, quantités, catégories, statuts,
                           prix et calculs des statistiques)
                           et services externes (Claude, Open Food Facts, caméra, OCR)
  styles/                  Feuilles de style : base, mise en page, composants, écrans
  sw/service-worker.js     Modèle du service worker (complété au build)
public/                    Fichiers copiés tels quels : manifeste, icônes, config.js
build/                     Génération du service worker au build
tests/
  unit/                    Calculs (dates, quantités, catégories, prix, statistiques…)
                           et règles d'architecture
  scenarios/               Parcours complets sur un iPhone simulé (Firebase simulé)
.github/workflows/         Tests, build et mise en ligne automatiques
firestore.rules            Règles de sécurité à coller dans Firebase (étape 1.6)
```

Sens des dépendances : `views` → `components` → `data/store` → `services` → `data/reference`.

### Travailler sur le code (facultatif)

Avec Node.js 22 ou plus récent :

| Commande | Effet |
|---|---|
| `npm install` | Installe les outils (une fois) |
| `npm run dev` | Lance l'app en local avec rechargement automatique |
| `npm test` | Lance tous les tests |
| `npm run build` | Construit le site dans `dist/` |

Données produits : © les contributeurs d'Open Food Facts, licence ODbL.
