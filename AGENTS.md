# Règles pour les agents de code (GPT, Claude Code et autres)

Projet : Vademecum PE, PWA statique pour les huissiers du Parlement européen.
HTML, CSS et JavaScript vanilla, sans build, hébergée sur GitHub Pages.
Ce fichier est la référence commune. `CLAUDE.md` renvoie ici.

## Flux de travail
- Ne jamais commiter ni pousser sur `main`. Une branche par tâche, puis une pull request. Ne pas fusionner : la fusion est faite par le mainteneur.
- Une pull request = une seule intention. Pas de refactorisation ni de renommage hors sujet.
- Ne pas modifier les workflows `.github/workflows/` sans demande explicite.
- Ne jamais écrire de jeton, mot de passe ou clé dans le dépôt.

## Avant d'ouvrir une pull request
1. Lancer tous les tests Node : `for t in tests/*.test.cjs; do node "$t" || exit 1; done`
2. Lancer les tests Python : `python -m unittest discover -s tests -p 'test_*.py'`
3. Supprimer les dossiers `__pycache__` avant de valider.
4. Ne jamais affirmer qu'un test, une mesure ou une vérification a été exécuté s'il ne l'a pas été. Écrire « non exécuté » et la raison.

## Publication d'une version
- Mettre à jour `VERSION` dans `sw.js` (format `pe-pwa-vNNN`).
- Mettre à jour les paramètres `?v=` des fichiers modifiés et précachés, dans `sw.js` et dans les pages HTML.
- Tout nouveau fichier CSS/JS utilisé par une page doit figurer dans les listes de précache de `sw.js`.
- Ajouter une entrée datée et factuelle dans `CHANGELOG.md`.

## Contraintes techniques
- Pas de nouvelle dépendance, pas de build, pas de police ni de ressource externe, pas d'appel réseau tiers.
- Le thème clair/sombre utilise la clé `vf-night-theme` (défaut `light`) et les feuilles `css/shared-*.css`. Ne pas créer un second système.
- Cibles tactiles de 44 px minimum sur mobile, texte lisible de 12 px minimum, pas de défilement horizontal à 360, 390 et 1280 px.
- Contraste WCAG AA minimum, en clair comme en sombre.

## Données : à ne pas toucher sans demande explicite
- `members.json`, `coordinators.json`, `committees.json`, `hemicycle-seats.json`, `hemicycle-*-coordinates.json`.
- Ne jamais inventer une donnée (nom, fonction, siège, date, source). Toute donnée garde sa source et sa date.
- Dossiers `preview-v362/` et `preview-v364/` : ne pas modifier.

## Cavaliers (assistant de création)
- Ne pas modifier `cavaliers-core*.js`, les règles d'initiales ni le découpage des noms sans demande explicite : la règle des initiales est une décision du mainteneur.
- Les PDF officiels des députés sont réutilisés tels quels et ne sont jamais régénérés.
- Les cavaliers nominatifs et la bibliothèque privée restent locaux à l'appareil : aucun envoi vers un serveur.

## Confidentialité
- Les contacts et bibliothèques importés restent dans le navigateur de l'utilisateur.
- Ne pas ajouter d'analytics, de suivi ni de journalisation de données personnelles.

## Format du compte rendu de pull request
- Liste des fichiers modifiés, une phrase par fichier.
- Résultat réel de chaque test : commande et résultat.
- Points non vérifiés (iPhone et Android réels, hors-ligne réel, service worker installé).
