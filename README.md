# Kookia

Le stock de nourriture de la maison, partagé à deux : **frigo, congélateur, placard, fruits et légumes**. Une application web installée sur l'écran d'accueil de chaque iPhone depuis Safari : elle n'expire jamais et ne demande ni Mac ni compte développeur Apple.

- **Stock** par lieu, avec la date adaptée à chaque produit (date limite, « de préférence », estimée, congélation ou ancienneté).
- **Ajout** par code-barres (Open Food Facts), photo, ticket de caisse, grille de fruits et légumes ou saisie manuelle.
- **Recettes anti-gaspillage** proposées par Claude à partir du stock, et **liste de courses** partagée.
- **Prix et statistiques** : dépensé, consommé, jeté, mois par mois et par catégorie.
- **Historique** des changements sur 90 jours, et **partage en temps réel** entre les deux iPhone (Firebase), même hors ligne.

Tout est gratuit, sauf les fonctions Claude (facultatives, quelques centimes par usage).

## Installation (≈ 25 min, une seule fois)

Il faut un compte Google (Firebase), un compte GitHub, un ordinateur avec git ou GitHub Desktop, et iOS 16.4 ou plus récent.

### Étape 1 — Créer la base Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Créer un projet** (sans Google Analytics).
2. Icône **Web** `</>` → donnez un surnom, sans Firebase Hosting → **Enregistrer**.
3. Copiez le bloc qui commence par `const firebaseConfig = {` et gardez-le (dans Notes).
4. **Authentication** → *Commencer* → *Mode de connexion* → **Anonyme** → *Activer*.
5. **Firestore Database** → *Créer une base de données* → `eur3 (europe-west)` → **mode production**.
6. Onglet **Règles** : remplacez tout par le contenu du fichier `firestore.rules` → **Publier**.

L'offre gratuite « Spark » suffit, sans carte bancaire.

### Étape 2 — Mettre l'app en ligne (GitHub Pages)

1. Sur GitHub, créez un dépôt **public**.
2. Envoyez-y le contenu du dossier `kookia` (pas le dossier lui-même), avec `git add -A`, `git commit` et `git push`.
3. **Settings → Pages → Source : GitHub Actions**.
4. Onglet **Actions** : quand « Tests et mise en ligne » est vert (2 à 3 minutes), l'adresse de l'app apparaît dans **Settings → Pages**.

### Étape 3 — Premier iPhone

Ouvrez l'adresse dans **Safari** → **Partager** → **Sur l'écran d'accueil**, puis ouvrez Kookia depuis l'écran d'accueil. Collez le bloc `firebaseConfig`, saisissez votre prénom → **Créer un foyer**, puis **Envoyer** l'invitation à l'autre personne.

### Étape 4 — Second iPhone

Ouvrez le lien de l'invitation dans Safari, ajoutez l'app à l'écran d'accueil et ouvrez-la. Collez le message d'invitation entier, saisissez votre prénom → **Rejoindre le foyer**. Gardez l'invitation (elle est aussi dans **Réglages → Foyer partagé**) pour réinstaller l'app si besoin.

### Étape 5 — Clé Claude (facultatif, sur chaque iPhone)

Créez une clé sur [console.anthropic.com](https://console.anthropic.com) et ajoutez quelques euros de crédit, puis **Réglages → Recettes et photos** → collez la clé. Sans clé, tout fonctionne sauf les recettes, le ticket de caisse et la reconnaissance d'un produit en photo (la lecture de date reste possible, moins précise).

### Étape 6 — Rappel quotidien et pastille

Une app web ne peut pas envoyer de notification une fois fermée. Créez un rappel quotidien « Vérifier le stock » dans l'app **Rappels** d'iOS, et activez **Réglages → Alertes → Afficher sur l'icône** pour la pastille du nombre de produits à consommer vite.

## Utilisation

- **Stock** : filtres par lieu ; sections *Date à compléter*, *Périmés*, *À consommer vite*, *Oubliés depuis longtemps*, *En stock*. Chaque ligne montre l'essentiel (quantité, entamé) ; le compteur donne les jours. Le bandeau du haut mène aux **idées recettes**. Le bouton horloge ouvre l'**historique**.
- **Gestes** : le rond à gauche retire une unité. **Glisser une ligne vers la droite** fait la même chose ; **vers la gauche**, il montre **Entamé** et **Jeté**. **Annuler** reste possible quelques secondes.
- **Fiche d'un produit** : les gestes du quotidien en haut (**Consommé**, **Congeler**, **Jeté**, **Entamé ¾ ½ ¼**, **Ajouter aux courses**), la modification en dessous. Avec plusieurs unités, l'app demande combien.
- **Ajouter** : bouton **+** (code-barres, photo, ticket, fruits et légumes ou saisie). L'app propose la catégorie, le rangement et la date d'après le nom (pain : date estimée, 2 jours frais, 7 jours emballé) ; si le nom est inconnu et qu'il y a une clé, elle demande à Claude. Une catégorie ou un rangement corrigé est retenu pour ce produit, sur les deux iPhone. **Vérifiez toujours la date proposée.**
- **Ticket de caisse** : photographiez le ticket (plusieurs photos s'il est long, jusqu'à une centaine de lignes et plus), vérifiez, puis validez. Les articles non alimentaires (hygiène, entretien, animaux, sacs…) sont grisés et décochés : ils ne vont ni au stock ni dans les statistiques, sauf si vous les cochez. Claude retrouve les articles de la liste de courses achetés (« Glace » pour « Glace Nutella en pot ») ; décochez « Retirer … de la liste » pour en garder un.
- **Nombre, poids, prix** : dans la fiche, le nombre d'unités, le poids de chacune (chiffre, puis **g**, **kg**, **cl** ou **L**) et le prix à l'unité. Le dernier prix payé est proposé. Pour les fruits et légumes, poids total et prix payé sont répartis par pièce.
- **Entamé** : à l'ouverture, la date est raccourcie (lait 4 jours, confiture 30 jours…) et le produit va au frigo s'il le faut. La part en moins compte comme consommée ; si on jette le reste, seul ce reste compte comme jeté.
- **Recettes** : les produits à utiliser en priorité, le nombre de personnes, des filtres rapides (**Rapide**, **Léger**, **Végé**, **Batch**) et **Filtres** pour le reste (régime, temps, difficulté, origine ou envie), puis **Proposer 5 recettes**. Les filtres restent mémorisés sur l'iPhone (sauf l'envie). *Mes recettes* se range en onglets **Réalisables** (avec le stock, gratuit), **Favoris** et **Toutes** ; les nouvelles arrivent en tête. Sans régime choisi, au moins 2 recettes sur 5 ont de la viande ou du poisson. **J'ai cuisiné** retire les quantités de la recette (200 g d'un paquet de 500 g : le paquet est entamé).
- **Semaine** : Recettes → **Semaine** → **Préparer la semaine**. Cochez les jours et les repas (midi, soir), le nombre de personnes, les restes du soir pour le lendemain midi et une séance de batch cooking si vous voulez. Claude répartit le stock sur la semaine (ce qui périme d'abord, achats partagés entre recettes) et regroupe les courses, à ajouter en un toucher. Le planning est partagé entre les deux iPhone ; chaque repas peut être remplacé (autre recette de Claude ou une de vos recettes) ou retiré, et **J'ai cuisiné** le coche. Les filtres de l'écran Idées s'appliquent.
- **Courses** : un seul champ : « 2 lait », « lait x2 » ou « farine 1 kg » (le poids reste dans le nom). L'app signale ce qui est déjà en stock ; « par Marie » indique ce que l'autre a ajouté. Une fois les articles cochés, **Tout ranger dans le stock** les range d'un coup (rangement proposé, à vérifier) ; le bocal d'un article le range seul, avec sa fiche.
- **Stats** : valeur du stock actuel, puis dépensé, consommé et jeté sur la période, avec filtres par rayon, catégorie, lieu et personne. Les produits sans prix ne sont pas comptés.
- **Réglages** : prénom, alertes, clé Claude, foyer partagé ; le modèle, la synchronisation et « à propos » sont dans **Avancé**.

## Limites

- **Pas de notification** quand l'app est fermée : voir l'étape 6.
- **Dates estimées** (fruits et légumes, congélation) : ce sont des repères, marqués « ≈ ». Vérifiez l'aspect et l'odeur.
- **Propositions d'après le nom** (catégorie, produit retrouvé dans une recette) : elles peuvent se tromper ; une correction est retenue.
- **Statistiques** : elles commencent à leur mise en place. Un produit a un seul prix, le dernier, et une part entamée est estimée au quart près.
- **Ticket et photos** : la photo et la liste de courses sont envoyées à Claude ; la photo n'est pas conservée. Vérifiez les prix lus (remises, produits au poids), les abréviations et les packs (« 16 × 125 g » reste un seul produit).
- **Open Food Facts** est incomplet, et la lecture de date sans Claude est moins fiable.
- **Sécurité** : toute personne qui a l'invitation peut voir et modifier vos données.
- **Une app par iPhone** : utilisez toujours celle de l'écran d'accueil, pas Safari.

## Dépannage

| Message ou symptôme | Solution |
|---|---|
| « Texte non reconnu » à la connexion | Collez le bloc `firebaseConfig` complet, ou le message d'invitation entier. |
| « Activez la connexion Anonyme… » ou « Authentication n'est pas activé » | Étape 1.4. |
| « Base Firestore introuvable » | Étape 1.5. |
| « Accès refusé par Firebase », ou « …pas encore autorisé » (historique, statistiques) | Recollez `firestore.rules` dans Firestore → **Règles** → **Publier** (étape 1.6), puis rouvrez l'app. |
| « Aucun foyer ne correspond à ce code » | Renvoyez l'invitation depuis **Réglages → Foyer partagé**. |
| Ancienne version affichée, écran sans mise en forme, ou « Kookia ne s'est pas chargée » | Fermez l'app (glisser vers le haut dans le sélecteur d'apps), attendez quelques minutes et rouvrez-la, ou touchez **Recharger l'app**. Le stock, enregistré en ligne, n'est pas touché. |
| Tâche rouge dans l'onglet **Actions** de GitHub | Un test a échoué : rien n'est mis en ligne, les iPhone gardent la version précédente. Ouvrez la tâche pour voir lequel. |
| Une modification de l'autre iPhone n'apparaît pas | **Réglages → Avancé → Se reconnecter**, et vérifiez que l'autre iPhone a du réseau. |
| Caméra noire ou refusée | Réglages de l'iPhone → Safari → **Caméra** → Autoriser ; sinon fermez et rouvrez l'app, ou tapez les chiffres du code-barres. |
| « Crédit Claude épuisé » | Ajoutez du crédit sur console.anthropic.com. |

## Code

Vite pour le build, Vitest pour les tests, Firebase pour les données. À chaque envoi sur GitHub, les tests tournent puis le site est construit et mis en ligne ; un test rouge bloque la mise en ligne.

```
src/
  views/            Écrans et fiches (un dossier par écran)
  components/       Éléments d'affichage réutilisables
  data/store/       État partagé, Firebase, synchronisation, historique, statistiques
  data/reference/   Données fixes (catégories, lieux, fruits et légumes, vocabulaire)
  services/         Règles métier et services externes (Claude, Open Food Facts…)
  styles/           Feuilles de style
  sw/               Service worker (hors ligne, mises à jour)
tests/              Tests unitaires et parcours complets sur un iPhone simulé
firestore.rules     Règles de sécurité à coller dans Firebase
```

Sens des dépendances : `views` → `components` → `data/store` → `services` → `data/reference`. Un test vérifie ce sens et refuse les fichiers de plus de 200 lignes.

Avec Node.js 22 ou plus récent : `npm install`, puis `npm run dev` (app en local), `npm test` (tests) ou `npm run build` (site dans `dist/`).

Données produits : © les contributeurs d'Open Food Facts, licence ODbL.
