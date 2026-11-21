# Vademecum PE — 10e législature (2024–2029)

Application web progressive indépendante pour la consultation et la reconnaissance des députés européens et des responsables institutionnels, conçue pour les besoins opérationnels des huissiers. Ce n'est pas une publication officielle du Parlement européen.

[Application publique](https://aerlin23.github.io/Parlement-europeen_10th-term/) · [Historique des versions](CHANGELOG.md)

## Utilisation
- Annuaire des députés : recherche, groupes, pays, commissions, fonctions, portraits et fiches.
- Plans interactifs de Bruxelles et Strasbourg : recherche par siège, couleurs politiques, zoom et plein écran.
- Quiz de reconnaissance : photo/nom, nom/photo et nouveaux députés ; suivi local des erreurs.
- Commission européenne, institutions et organes de l'Union, Secrétariat général.
- Assistant cavaliers : saisie et import Excel, aperçu, PDF et impression. La variante personnelle conserve ses fonctions supplémentaires de reconnaissance et de bibliothèque locale.
- Contacts utiles : import local PDF/JSON et favoris. N'importer que les documents autorisés.
- Installation PWA depuis le menu du navigateur ; télécharger les ressources nécessaires avant un usage hors connexion.

## Architecture

| Ressource | Fonction |
| --- | --- |
| index.html, styles.css | Interface principale |
| directory.js, interface.js, smart-search.js, features.js | Annuaire, navigation, recherche, historique |
| hemicycle.js | Plans interactifs |
| quiz.js | Entraînement |
| creation-cavaliers.html, cavaliers-core.js, creation-cavaliers-227.js, cavaliers-assistant-232.js | Assistant public |
| creation-cavaliers-preview.html, cavaliers-core-preview.js, creation-cavaliers-editor-preview.js, cavaliers-assistant-preview.js | Variante personnelle |
| contacts-personnels.html | Contacts importés localement |
| outils.html, outils.js | Outils et réunions conjointes |
| js/version-display.js, offline.js, sw.js | Version active, installation et cache |
| members.json, committees.json, coordinators.json | Données parlementaires |
| hemicycle-seats.json, hemicycle-*-coordinates.json | Sièges et géométrie |
| commission-members.json, changes.json | Commission et historique éditorial |
| photos/, thumbs/, photo-assets.json | Portraits |

## Sources et fraîcheur
- [Liste officielle des députés](https://www.europarl.europa.eu/meps/en/full-list/xml).
- [Données ouvertes](https://data.europarl.europa.eu/api/v2/meps/show-current).
- [Commissions](https://www.europarl.europa.eu/committees/fr/home).
- [Hémicycles](https://www.europarl.europa.eu/plenary/fr/hemicycle.html).
- Les dates de contrôle figurent dans les enregistrements lorsqu'elles sont disponibles. Le dernier changement éditorial ne constitue pas une vérification exhaustive.
- Strasbourg : affectations du document daté du 23/11/2026 pour la session à venir ; géométrie du 19/10/2026. Bruxelles : document du 11/11/2026.
- Trois anciennes nominations de coordinateurs retirées en v355 ; successeurs non confirmés. La couverture des coordinateurs n'est pas exhaustive.

## Confidentialité et sécurité
Le dépôt et le site sont publics. Les onglets cachés ne constituent pas une authentification. Ne pas publier de contacts internes ou de bibliothèques privées ; les importer localement uniquement si autorisé. Les données passées peuvent rester dans l'historique Git. Les dépendances documentaires externes sont épinglées par version ; leur intégrité et disponibilité doivent être contrôlées. L'adresse de contact publiée et les conditions de réutilisation des portraits restent à examiner.

## Préparer le fonctionnement hors connexion
- Ouvrir l’application en ligne et attendre l’installation du service worker. Les fichiers principaux sont mis en cache à l’installation ; les rubriques secondaires sont téléchargées au mieux.
- Depuis l’accueil, utiliser **Télécharger les ressources hors ligne** pour enregistrer les portraits, les voix officielles et les bibliothèques documentaires. Le téléchargement complet peut utiliser beaucoup de stockage et de données mobiles.
- Une première connexion reste nécessaire. Les PDF de cavaliers officiels non consultés et certains médias externes ne sont pas garantis hors ligne.
- Les favoris, contacts importés et bibliothèques privées sont conservés localement par le navigateur ; ne pas vider les données du site pour mettre l’application à jour.
- Après une mise à jour, tester l’accueil, une recherche, les deux hémicycles, un quiz et la création d’un cavalier en mode avion.
- Les contrôles hors ligne automatisés sont structurels ; un test réel sur appareils et navigateurs reste nécessaire.

## Développement et publication
1. Travailler sur une branche dédiée ; référence stable : stable-v355.
2. Vérifier les changements de données contre les sources officielles ; ne pas publier automatiquement des corrections non relues.
3. Exécuter `node tests/data-integrity.test.cjs`, `node tests/cavaliers-core.test.cjs` et `node --check` sur les scripts.
4. Contrôler les tests navigateur et le mode hors ligne avant fusion.
5. Incrémenter VERSION dans sw.js ; vérifier les références de ressources modifiées et la liste de précache. Le pied de page interroge le service worker actif.
6. Ne fusionner vers main qu'après validation.

La branche consolidation-v2 est expérimentale. Les performances, l'accessibilité, l'impression physique et la compatibilité sur appareils réels doivent encore être validées. Le PDF généré peut être matriciel ; la variante personnelle réutilise les PDF originaux disponibles.

[Guide officiel Mobile Print](https://mfd.europarl.europa.eu/pdf/mobile-printing-qsg_en.pdf)
