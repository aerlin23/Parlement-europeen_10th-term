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
- **Assistant cavaliers** : import par copier-coller ou fichier Excel (.xlsx, .xls, .csv), filtrage syntaxique des lignes, correction des participants, aperçu et impression A4 recto uniquement. Sur mobile, génération et partage du PDF vers la messagerie pour Mobile Print.

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
| `creation-cavaliers.html`, `creation-cavaliers-225.js`, `cavaliers-assistant-225.js` | Assistant cavaliers |
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

## État de maintenance

Version 219 : séparation conservatrice des scripts classiques et du CSS, correction du score du quiz, cache durable des médias téléchargés et URLs de ressources versionnées. Les tests navigateur restent nécessaires avant de considérer la refonte validée.

## Version 220 (branche de validation)

Recherche combinée par pays, groupe et commission/fonction ; cinq consultations récentes conservées sur l'appareil ; révision adaptative tenant compte du délai depuis la dernière réponse et du temps de réponse ; filtres facultatifs de pays, commission et fonction sur les plans. Aucun quiz de localisation ajouté. Les filtres de commission portent sur les titulaires.

Version 221 : filtre du plan limité au pays, intégré à la ligne de recherche ; les couleurs et filtres politiques existants restent disponibles.

## Assistant cavaliers

Accessible depuis le menu principal sur ordinateur et mobile : [ouvrir l’assistant](https://aerlin23.github.io/Parlement-europeen_10th-term/creation-cavaliers.html).

Les fichiers importés sont traités dans le navigateur. Le lecteur Excel est chargé depuis un CDN et requiert une connexion lors du chargement. Vérifier les noms et les exclusions avant impression : le filtrage ne constitue pas une validation d’identité. Imprimer en A4, recto uniquement, à 100 %, puis plier les feuilles. Sur mobile, partager le PDF avec la messagerie et coller l’adresse `mobileprint@europarl.europa.eu` ; la copie automatique et le partage dépendent du navigateur. Consulter le [guide officiel Mobile Print](https://mfd.europarl.europa.eu/pdf/mobile-printing-qsg_en.pdf). Ne transmettre que les documents autorisés par les règles internes applicables.

Version PWA 236 : accès public à l’assistant. Les réunions conjointes restent en mode expérimental.
