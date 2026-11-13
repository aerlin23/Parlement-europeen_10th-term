# Vademecum PE

**Annuaire interactif, localisation des places en hémicycle et entraînement à la reconnaissance des députés européens.**  
**Parlement européen — 10e législature (2024–2029)**

[**Ouvrir l'application**](https://aerlin23.github.io/Parlement-europeen_10th-term/) · [Source officielle des députés](https://www.europarl.europa.eu/meps/fr/full-list) · [Plans d'hémicycle](https://www.europarl.europa.eu/plenary/fr/hemicycle.html)

> **Statut : projet indépendant, non officiel.** Vademecum PE n'est ni édité ni validé par le Parlement européen. Les informations publiques reprises dans l'application ne remplacent pas les sources institutionnelles. Les données peuvent évoluer entre deux actualisations.

## Objectif et public

Vademecum PE est une **Progressive Web App (PWA)** conçue pour faciliter la consultation d'informations parlementaires dans un contexte professionnel : identifier rapidement un député, comprendre ses responsabilités, retrouver sa place en séance et s'entraîner à reconnaître les visages.

Public susceptible d'y trouver un intérêt : agents d'accueil et de séance, huissiers, collaborateurs parlementaires, assistants, personnels administratifs, nouveaux arrivants et personnes étudiant les institutions européennes.

L'application est accessible sur navigateur, sur ordinateur ou mobile, et peut être installée depuis un navigateur compatible.

## Fonctionnalités

### Annuaire des députés

- Répertoire des **720 députés** correspondant à la photographie des données publiée dans l'application (le nombre réel de sièges occupés et les mandats peuvent évoluer).
- Portraits, pays, groupes politiques, partis nationaux et liens vers les fiches officielles.
- Présentation des responsabilités : présidence et vice-présidences du Parlement, questeurs, présidences et vice-présidences de commissions et autres fonctions disponibles.
- Présentation par groupe politique avec identité visuelle adaptée et comptages de responsabilités.
- Affiliations aux commissions, avec priorité aux **membres titulaires** dans le filtre principal.
- Affichages classique et compact, avec adaptation aux écrans mobiles.

### Recherche et filtres

- Recherche par nom.
- Recherche par numéro de place : **S328** à Strasbourg ou **B328** à Bruxelles (exemples de syntaxe, pas d'attribution à une personne).
- Filtres par groupe, commission, pays, genre et fonction ; options de tri.
- Filtres avancés repliables sur mobile.

### Places dans les hémicycles

- Numéro de place à **Strasbourg (Str)** et à **Bruxelles (Bru)** sur les fiches disponibles.
- Clic sur un numéro pour afficher un schéma interactif des sièges, avec repère et zoom.
- Données de places conservées dans `hemicycle-seats.json`, et coordonnées graphiques dans des fichiers dédiés à chaque hémicycle.
- Références des plans utilisés : **Strasbourg, 19 octobre 2026** ; **Bruxelles, 11 novembre 2026**.

**Limite importante :** l'existence de coordonnées pour une place ne constitue pas une vérification visuelle individuelle du repère sur le PDF. La disposition et les attributions peuvent changer : contrôler le plan officiel avant une utilisation opérationnelle sensible.

### Quiz de reconnaissance

- Deux sens d'entraînement : **photo → nom** et **nom → photo**.
- Sessions de **20 questions maximum**, avec quatre propositions.
- Choix de réponses difficiles, notamment des noms et profils proches.
- Bilan des résultats et possibilité de rejouer les erreurs.
- Écoute du nom lorsqu'un fichier audio compatible est disponible.

### Périmètre institutionnel complémentaire

L'application donne accès à plusieurs vues et répertoires :

- **Commission européenne** : commissaires, portraits, portefeuilles et quiz.
- **Institutions et organes européens** : responsables institutionnels et fonctionnalités de consultation/entraînement.
- **Secrétariat général du Parlement européen** : responsables, directions générales et informations d'organisation.
- Ressources visuelles annexes, notamment relatives aux **présidences du Conseil de l'UE**.

### Derniers changements

- Journal de mouvements parlementaires sous forme de fiches.
- Filtrage par **Fonctions**, **Groupes** ou **Députés** ; cinq changements affichés initialement, puis accès à la liste complète.
- Liens vers les fiches et, lorsqu'elles sont renseignées, vers les sources.
- Données éditoriales dans `changes.json`.

Le journal est actuellement **maintenu manuellement** ; la date d'un événement ne doit pas être confondue avec la date de sa détection ou de publication dans l'application.

### PWA et mode hors connexion

- Installation possible depuis un navigateur compatible grâce à `manifest.webmanifest`.
- Service worker (`sw.js`) assurant la mise en cache de ressources de base et la gestion des versions.
- Téléchargement facultatif de médias officiels pour étendre l'utilisation hors connexion.
- Notification de mise à jour lorsqu'une nouvelle version du service worker est disponible.

La disponibilité hors ligne **n'est pas garantie pour toutes les ressources externes** : elle dépend du navigateur, du cache disponible, des fichiers déjà téléchargés et des restrictions des serveurs d'origine.

## Architecture et fichiers principaux

| Ressource | Rôle |
| --- | --- |
| `index.html` | Interface principale, annuaire, filtres, quiz, journal, module du Secrétariat général et plans interactifs |
| `members.json` | Données des députés et fonctions associées |
| `committees.json` | Référentiel des commissions |
| `hemicycle-seats.json` | Correspondance députés / numéros de places |
| `hemicycle-str-coordinates.json` | Coordonnées des places sur le plan de Strasbourg |
| `hemicycle-bru-coordinates.json` | Coordonnées des places sur le plan de Bruxelles |
| `changes.json` | Historique éditorial des mouvements |
| `commission-europeenne.html`, `commission-members.json` | Module Commission européenne |
| `institutions-agences.html` | Module institutions et organes |
| `secretariat-general.html` | Redirection vers la vue intégrée du Secrétariat général |
| `sw.js`, `manifest.webmanifest` | PWA, cache et installation |
| `assets/` | Images et éléments graphiques de l'application |

**Choix technique actuel :** site statique HTML/CSS/JavaScript, données JSON, hébergement GitHub Pages, sans serveur applicatif dédié. Le fichier principal concentre encore une grande partie de l'interface et de la logique ; une séparation en modules faciliterait la maintenance.

## Installation locale et déploiement

### Consultation

Ouvrir : https://aerlin23.github.io/Parlement-europeen_10th-term/

### Exécution locale

Un serveur HTTP local est préférable à l'ouverture directe de `index.html` en `file://`, car l'application récupère des fichiers JSON avec `fetch()`.

```bash
git clone https://github.com/aerlin23/Parlement-europeen_10th-term.git
cd Parlement-europeen_10th-term
python3 -m http.server 8000
```

Accéder ensuite à **http://localhost:8000/**. L'installation du service worker nécessite un contexte sécurisé (localhost ou HTTPS) et un navigateur compatible.

### Publication

Le site est configuré pour être publié avec **GitHub Pages** depuis la branche `main` et le répertoire racine :

`Settings → Pages → Deploy from a branch → main → /(root)`

Après publication, vérifier l'actualisation de la PWA et les fonctionnalités hors ligne sur un appareil réel.

## Sources, mises à jour et qualité des données

Sources utilisées ou référencées dans le projet :

- [Liste officielle des députés européens (XML)](https://www.europarl.europa.eu/meps/en/full-list/xml)
- [Données ouvertes du Parlement européen](https://data.europarl.europa.eu/api/v2/meps/show-current)
- [Fiches officielles des députés](https://www.europarl.europa.eu/meps/fr/full-list)
- [Plans et répartition en hémicycle](https://www.europarl.europa.eu/plenary/fr/hemicycle.html)
- [Arrivées](https://www.europarl.europa.eu/meps/en/incoming-outgoing/incoming) et [départs](https://www.europarl.europa.eu/meps/en/incoming-outgoing/outgoing)

**Processus de mise à jour actuel :** les données principales et l'historique ne se synchronisent pas automatiquement avec les sources officielles. Les fichiers JSON doivent être contrôlés, corrigés puis publiés. La page prévoit des fonctions de vérification locale/import de données ; cela ne vaut pas publication automatique.

Lors de chaque actualisation :

1. Vérifier les arrivées et départs, groupes, commissions, responsabilités et places sur les sources officielles.
2. Ne pas inférer le genre à partir d'un nom ou d'une photographie ; privilégier une donnée explicitement publiée.
3. Conserver la provenance et la date de vérification lorsque ces champs existent.
4. Vérifier la cohérence des identifiants, liens, images et attributions.
5. Mettre à jour `changes.json` si un événement pertinent a été confirmé.
6. Tester recherche, filtres, quiz, ouvertures de fiches, cartes des places et affichage mobile avant publication.
7. Vérifier les caches PWA et la disponibilité hors connexion après déploiement.

## Limites connues et axes d'amélioration

- **Actualité des données :** synchronisation officielle automatisée et contrôles différentiels à développer.
- **Couverture des fonctions :** certains rôles de groupe peuvent être documentés de façon incomplète.
- **Plans :** validation visuelle exhaustive des coordonnées et contrôle de chaque nouvelle répartition à formaliser.
- **Qualité logicielle :** tests automatisés, validations de schéma JSON, intégration continue et revue de sécurité à renforcer.
- **Maintenabilité :** séparation progressive du code monolithique en modules.
- **Accessibilité :** audit WCAG et tests avec clavier, lecteur d'écran et appareils mobiles à réaliser.
- **Hors ligne :** comportement des médias externes et des quotas de stockage à tester sur les principaux navigateurs.

Aucune certification de sécurité, d'accessibilité ou approbation institutionnelle n'est revendiquée.

## Confidentialité, droits et responsabilité

Les informations publiées sont destinées à un usage informatif. Les portraits, logos et autres contenus provenant des institutions restent soumis aux conditions de réutilisation de leurs ayants droit. Le fait qu'une source soit publique ne signifie pas que son contenu soit libre de toute restriction.

Le dépôt GitHub et les données distribuées au navigateur sont accessibles techniquement : l'application **ne prétend pas empêcher la copie ou l'extraction des fichiers publics**.

## Contact

**Administrateur du site :** [frederic.perou@europarl.europa.eu](mailto:frederic.perou@europarl.europa.eu)

**Vademecum PE — projet indépendant et non officiel.**
