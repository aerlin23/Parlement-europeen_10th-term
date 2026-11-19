# Vademecum PE — 10e législature (2024–2029)

Application web progressive (PWA) indépendante, destinée à la consultation et à la reconnaissance des députés européens et des responsables institutionnels. Elle ne constitue pas une publication officielle du Parlement européen.

**Accès :** https://aerlin23.github.io/Parlement-europeen_10th-term/

## Fonctionnalités

- Annuaire des députés : portraits, pays, groupes politiques, fonctions, commissions titulaires et suppléants.
- Recherche par nom, groupe, commission et siège (S328 pour Strasbourg, B328 pour Bruxelles).
- Filtres contextuels et décomptes cliquables des responsabilités parlementaires.
- Plans interactifs des deux hémicycles : couleurs et surbrillance des groupes, recherche, zoom, déplacement, plein écran, rotation selon le navigateur, identification par portrait et accès à la fiche. Strasbourg est ouvert par défaut.
- Quiz photo/nom et nom/photo, suivi des erreurs et de la progression.
- Trois tailles de lecture (A−, A, A+) avec préférence locale.
- Rubriques Commission européenne, institutions et organes, Secrétariat général.
- Historique éditorial des mouvements parlementaires, partage des fiches et fonctionnalités hors ligne.
- **Assistant cavaliers** : import par copier-coller ou fichier Excel (.xlsx, .xls, .csv), filtrage syntaxique des lignes, correction des participants, aperçu et impression A4 recto uniquement. Sur ordinateur et mobile, génération du PDF et impression par e-mail via Mobile Print ; impression classique ePrinter conservée sur ordinateur.

## Architecture

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure de l’interface |
| `styles.css` | Styles et adaptation aux écrans |
| `directory.js`, `interface.js` | Annuaire, filtres, navigation et institutions |
| `hemicycle.js` | Plans interactifs |
| `quiz.js` | Quiz et progression |
| `offline.js` | Téléchargement et mises à jour PWA |
| `smart-search.js` | Suggestions de recherche |
| `features.js` | Partage et historique des changements |
| `creation-cavaliers.html`, `creation-cavaliers-227.js`, `cavaliers-assistant-232.js`, `cavaliers-core.js` | Assistant cavaliers |
| `commission-europeenne.html`, `institutions-agences.html` | Rubriques complémentaires |
| `members.json`, `committees.json`, `coordinators.json` | Données parlementaires |
| `hemicycle-seats.json` | Correspondances député–siège |
| `hemicycle-*-coordinates.json` | Géométrie des plans |
| `changes.json` | Historique éditorial |
| `sw.js`, `manifest.webmanifest` | Cache hors ligne et installation PWA |
| `photos/`, `thumbs/`, `photo-assets.json` | Portraits et index des ressources |

## Sources et fiabilité

- [Liste officielle des députés](https://www.europarl.europa.eu/meps/en/full-list/xml).
- [Données ouvertes du Parlement européen](https://data.europarl.europa.eu/api/v2/meps/show-current).
- [Commissions parlementaires](https://www.europarl.europa.eu/committees/fr/home).
- [Plans officiels des hémicycles](https://www.europarl.europa.eu/plenary/fr/hemicycle.html) : références utilisées pour les plans intégrés, Strasbourg 19 octobre 2026 et Bruxelles 11 novembre 2026.
- [Entrées et départs](https://www.europarl.europa.eu/meps/en/incoming-outgoing/incoming).
- Fonctions et coordinateurs : sources et dates figurant dans les données lorsque disponibles.

Les portraits proviennent principalement des ressources officielles. Les places, mandats et fonctions évoluent ; vérifier les sources officielles en cas de doute. La couverture des coordinateurs et la précision de toutes les coordonnées ne sont pas garanties exhaustives.

## Maintenance et publication

1. Mettre à jour les données à partir des sources officielles, conserver les dates et références, contrôler les identifiants et les doublons.
2. Vérifier les filtres, le quiz, les deux plans et les liens vers les fiches.
3. Contrôler la syntaxe JavaScript et préserver l'ordre de cascade CSS. Tester en particulier les interfaces mobile, portrait et paysage.
4. Incrémenter la version du cache dans `sw.js`, les URL des modules et la liste CODE du service worker (l’adresse d’enregistrement de sw.js reste stable).
5. Publier via GitHub Pages : branche `main`, racine du dépôt.

L'installation PWA est proposée par les navigateurs compatibles. Précharger les ressources avant une utilisation hors ligne ; certaines ressources officielles peuvent ne pas être disponibles. La rotation automatique dépend des restrictions du navigateur. Les préférences de lecture et certaines informations de navigation sont conservées localement sur l'appareil.


## Qualité et cycle de publication

- Branche `main` : publication GitHub Pages.
- Branche `validation-infrastructure-v292` : changements en validation, sans publication automatique sur le site.
- Sauvegarde `sauvegarde-v289-2026-11-19` : point de restauration historique.
- Exécuter depuis la racine : `node tests/vademecum-audit.cjs` puis `node tests/cavaliers-core.test.cjs`.
- GitHub Actions exécute ces contrôles à chaque push et pull request. Un résultat vert ne remplace pas les essais sur Android, iOS, ordinateur, réseau coupé et impression.
- Avant fusion, vérifier les différences, le rendu et la concordance des versions du cache. Éviter de modifier directement la branche de publication pour les changements structurels.

## Contacts et confidentialité

Les contacts importés, favoris et sauvegardes locales sont conservés sur l'appareil. Ils ne doivent jamais être ajoutés au dépôt public. Les tests utilisent des valeurs fictives. Le mode expérimental ou masqué n'est pas une authentification. Les ressources publiques restent accessibles et l'historique Git doit faire l'objet d'un traitement distinct si des informations sensibles y ont figuré.

## État de validation

La version publique de référence est v291. La branche de validation prépare la restauration locale des contacts et favoris, les contrôles automatiques et la documentation. Les bibliothèques externes, la mutualisation CSS et l'isolation des outils personnels restent à traiter. Aucun résultat de test navigateur ou audit de sécurité complet n'est revendiqué.
