# Historique des versions

## v374 — onglets des groupes et encarts des commissions en mode nuit

- Onglets des groupes politiques distingués par leurs couleurs, avec sélection explicite en mode nuit.
- Encarts des présidences et coordinateurs des commissions assombris ; titres, noms et liens rendus lisibles.
- Aucun changement du mode clair ni des données des députés.

## v373 — Contacts utiles : alignement et paramètres

- Lignes des bureaux BRU et STR alignées sur deux colonnes stables dans les fiches développées sur mobile.
- Import / mise à jour de l'annuaire déplacé à l'intérieur des paramètres (engrenage) dès qu'un annuaire est chargé ; premier import visible en l'absence de données.
- Aucune modification des données de contacts ni de la recherche intelligente.

## v372 — photos des autres institutions et proposition Contacts utiles
- Cache hors ligne des portraits externes d’autres institutions et ajout au téléchargement des médias (b5f1f84ab).
- Sur cette branche non fusionnée : harmonisation du thème et de l’import de Contacts utiles.
- Recherche locale tolérant accents, ordre des mots, une faute de frappe sur les noms longs et saisies de numéros, sans envoi des contacts au réseau.

## v371 — filtres de l'hémicycle
- Champs de recherche et Pays ramenés à 38 px sur mobile (dd9cb3a9c).

## v370 — alignement des filtres
- Alignement de la recherche et du pays via une grille mobile (12ee23e34).

## v369 — filtre Pays
- Élargissement du filtre Pays sur mobile (fb36ad7d7).

## v368 — nom de député avec lettres inversées
- Suggestion d'un PDF original en cas de transposition de lettres (ee7c5d8cc).

## v367 — correspondances de cavaliers privés
- Proposition confirmable pour un nom privé avec une lettre différente (a19f892fa).

## v366 — navigation de la PWA
- Retour « Tous les députés » rendu relatif (12f25a982).

## v365 — version officielle et cavaliers
- Mise à jour du service worker et de ses références de cache (2b361e9a8).
- Initiales des prénoms composés séparées par des espaces (d1c7c4be0).
- Correction d'un test du quiz et de deux exemples de cavaliers (1e1058598).

## v364 — aperçu des cavaliers
- Dans l'aperçu v364, amélioration du rapprochement vers un PDF par nom et civilité (b38ff484b).


## v363 — contraste mode nuit et fiabilité CI

- Annuaire : pays, groupes, sièges Bruxelles/Strasbourg et commissions plus lisibles en mode nuit, sans modifier les couleurs du mode clair.
- Bouton flottant réduit, contraste renforcé et indicateur de focus plus visible.
- Tests de contraste WCAG AA et tests navigateur en mode nuit sur Chromium et WebKit.
- GitHub Actions : syntaxe JavaScript vérifiée dans les dossiers de scripts, tests d'intégrité et de politique CI, annulation des exécutions redondantes.
- Lighthouse conserve une exécution manuelle ; la surveillance officielle reste programmée en semaine.
- Les contrôles CI ne bloquent pas une fusion sans règle de protection de branche configurée sur GitHub.

## v361 — noms composés

- Prénoms composés conservant leur trait d'union dans les initiales des cavaliers : Jean-Pierre devient J.-P. (public et personnel).
- Tests unitaires adaptés et références de cache actualisées.

## v360 — stabilité graphique

- Réservation d'espace avant chargement des députés pour réduire les décalages de mise en page.
- Préchargement du logo de l'en-tête.
- Lighthouse sur serveur local : mobile 57/100, bureau 78/100, accessibilité 97/100, CLS mobile 0,172 (contre 0,446 auparavant). LCP mobile encore trop lent (8,4 s) ; voir PERFORMANCE.md.

## v359 — consolidation expérimentale

- Nouveaux cavaliers en PDF texte vectoriel quand les glyphes sont compatibles ; retour JPEG si nécessaire, PDF officiels préservés.
- Ajout de tests unitaires pour le placement PDF et la veille des députés.
- Veille quotidienne en semaine de la liste officielle : signalement pour revue humaine, sans publication automatique.
- Workflow Playwright Chromium/WebKit mobile et Lighthouse mobile/desktop ajouté (résultats d'exécution à vérifier).
- Politique de confidentialité et contrôles des fichiers sensibles, meta referrer et CSP minimale.
- 14 scripts historiques non utilisés retirés ; sauvegarde stable-v355 inchangée.

## v358 — CSS mutualisé

- Extraction de sept blocs CSS communs des pages de l'application, sans modifier leur ordre de cascade.
- Préchargement de ces feuilles dans le service worker.

## v357 — mode hors ligne (branche de consolidation)

- Installation PWA plus robuste : fichiers essentiels obligatoires, autres ressources non bloquantes.
- Mise en cache durable des bibliothèques Excel/PDF/ZIP, y compris le lecteur PDF des contacts, après utilisation ou téléchargement explicite.
- Le bouton de téléchargement hors ligne prépare aussi ces bibliothèques et signale leurs éventuels échecs.
- Une activation externe du service worker ne recharge plus automatiquement la page pendant le travail de l'utilisateur.
- Nouveau test de régression structurel du cache hors ligne dans GitHub Actions.
- Les PDF de cavaliers distants non téléchargés et les limites de stockage du navigateur restent des restrictions.

## v356 — consolidation expérimentale

- Version affichée centralisée, métadonnées mobiles harmonisées et cache amélioré.

## v355

- Retrait de trois anciennes nominations de coordinateurs (PECH/PPE, PETI/PPE, CONT/Verts-ALE), successeurs non confirmés.

## Documentation historique conservée

# Vademecum PE — 10e législature (2024–2029)

Application web progressive (PWA) indépendante, destinée à la consultation et à la reconnaissance des députés européens et des responsables institutionnels. Elle ne constitue pas une publication officielle du Parlement européen.

**Accès :** https://aerlin23.github.io/Parlement-europeen_10th-term/

## Fonctionnalités

- Annuaire des députés : portraits, pays, groupes politiques, fonctions, commissions titulaires et suppléants.
- Recherche par nom, groupe, commission et siège (S328 pour Strasbourg, B328 pour Bruxelles).
- Filtres contextuels et décomptes cliquables des responsabilités parlementaires.
- Plans interactifs des deux hémicycles : couleurs et surbrillance des groupes, recherche, zoom, déplacement, plein écran, rotation selon le navigateur, identification par portrait et accès à la fiche. Strasbourg est ouvert par défaut.
- Quiz photo/nom et nom/photo, quiz des derniers députés arrivés d’après l’historique documenté, suivi des erreurs et de la progression.
- Trois tailles de lecture (A−, A, A+) avec préférence locale.
- Rubriques Commission européenne, institutions et organes, Secrétariat général.
- Historique éditorial des mouvements parlementaires, partage des fiches et fonctionnalités hors ligne.
- **Assistant cavaliers** : import par copier-coller ou fichier Excel (.xlsx, .xls, .csv), filtrage syntaxique des lignes, correction des participants, aperçu et impression A4 recto uniquement. Sur ordinateur et mobile, génération du PDF et impression par e-mail via Mobile Print ; impression classique ePrinter conservée sur ordinateur.

- **Contacts utiles** : annuaire téléphonique importé sur chaque appareil, favoris locaux, appels et partage individuel. Les annuaires et bibliothèques privées ne sont pas distribués par le site ; importer uniquement des fichiers dont l’utilisateur est autorisé à disposer.

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
| `creation-cavaliers.html`, `creation-cavaliers-227.js`, `cavaliers-assistant-229.js`, `cavaliers-core.js` | Assistant cavaliers |
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
- [Plans officiels des hémicycles](https://www.europarl.europa.eu/plenary/fr/hemicycle.html) : références utilisées pour les plans intégrés, Strasbourg 23 novembre 2026 et Bruxelles 11 novembre 2026.
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

Les fichiers importés sont traités dans le navigateur. Le lecteur Excel est chargé depuis un CDN et requiert une connexion lors du chargement. Vérifier les noms et les exclusions avant impression : le filtrage ne constitue pas une validation d’identité. Imprimer en A4, recto uniquement, à 100 %, puis plier les feuilles. Sur ordinateur et mobile, partager le PDF avec la messagerie et coller l’adresse `mobileprint@europarl.europa.eu` ; la copie automatique et le partage dépendent du navigateur. Consulter le [guide officiel Mobile Print](https://mfd.europarl.europa.eu/pdf/mobile-printing-qsg_en.pdf). Ne transmettre que les documents autorisés par les règles internes applicables.

Version PWA 236 : accès public à l’assistant. Les réunions conjointes restent en mode expérimental.

### Maintenance Assistant cavaliers (227)

Import centralisé dans `cavaliers-core.js`, reconnaissance des en-têtes français/anglais et des colonnes réordonnées, dédoublonnage par prénom et nom, annulation de la dernière suppression. Tests de régression : `node tests/cavaliers-core.test.cjs`. Le PDF partagé reste matriciel (JPEG intégré), et les tests navigateur et impression physique restent nécessaires. Les anciennes ressources versionnées sont conservées pour les clients qui utilisent encore des pages mises en cache.

Version PWA 244 : restauration de l’en-tête institutionnel d’origine, avec les logos et couleurs des groupes politiques. Les onglets Vademecum, S’entraîner et Cavaliers restent réunis dans une navigation à trois boutons.

Version PWA 245 : l’Assistant cavaliers reprend le grand en-tête bleu et le logo institutionnel de l’annuaire, sans modifier les en-têtes des groupes politiques. Le bandeau secondaire est supprimé.

Réunions conjointes (251, expérimental) : tri par groupes dans l’ordre du Vademecum, puis présidence, vice-présidences dans l’ordre renseigné et autres titulaires par nom. Les listes et trombinoscopes imprimables suivent le même ordre.

Version PWA 252 : harmonisation visuelle de Réunions conjointes avec l’Assistant cavaliers (bandeau institutionnel, navigation et panneaux), sans changement du tri ni du mode expérimental.

Version PWA 339 : actualisation des 720 affectations de Strasbourg selon le plan du 23 novembre 2026 (247 différences, dont deux sièges précédemment non renseignés). Bruxelles et la géométrie des plans sont conservés.


## Maintenance v354 — 20 novembre 2026

- Contrôles automatiques : `node tests/data-integrity.test.cjs`, `node tests/cavaliers-core.test.cjs` et syntaxe JavaScript. Workflow GitHub Actions intégré ; consulter les résultats avant de considérer une version validée.
- SheetJS CE 0.20.3 remplace 0.18.5 dans les deux assistants (CVE-2023-30533 et CVE-2024-22363).
- Les bibliothèques documentaires versionnées peuvent être conservées après un premier chargement réussi sous le service worker actif. Tester hors ligne sur appareil ; les PDF originaux distants ne sont pas tous préchargés.
- Annuaire institutionnel simplifié, SEAE représenté par la haute représentante, recherche par nom/fonction/institution/pays/acronyme.
- Version affichée synchronisée avec le service worker ; dates des plans hémicycle visibles séparément. Strasbourg : affectations du 23/11/2026, géométrie du 19/10/2026 ; Bruxelles : 11/11/2026.
- Mode nuit, partage de page, recherche de cavaliers existants (version personnelle), formulaire compact.
- Trois affectations de coordinateurs à confirmer : Gabriel Mato/PECH, Alma Ezcurra Almansa/PETI, Damian Boeselager/CONT. Ne pas déduire un remplaçant sans source.
- Confidentialité : le dépôt et GitHub Pages sont publics. Un onglet masqué ou un indicateur local ne constitue pas un contrôle d'accès. Ne jamais publier de données internes non autorisées ; utiliser un stockage local ou un hébergement authentifié. Les archives privées importées ne doivent pas être ajoutées au dépôt.
