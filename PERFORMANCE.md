# Contrôle des performances — Vademecum PE

Mesures automatisées Lighthouse sur un serveur local GitHub Actions (Ubuntu 24.04). Ce ne sont pas des mesures sur un iPhone ou Android physique. Les valeurs peuvent varier selon CPU, réseau et état du cache. Les rapports HTML/JSON sont disponibles dans les artefacts du workflow « Lighthouse performance and accessibility ».

| Mesure | Avant consolidation du décalage | Après correction du décalage (v360) |
| --- | ---: | ---: |
| Performance mobile | 51/100 | **57/100** |
| Performance ordinateur | 75/100 | **78/100** |
| Accessibilité (mobile/ordinateur) | 97/100 | **97/100** |
| Bonnes pratiques (mobile/ordinateur) | 96/100 / 100/100 | **96/100 / 100/100** |
| SEO (mobile/ordinateur) | 100/100 | **100/100** |
| CLS mobile (cible <0,1) | 0,446 | **0,172** |
| CLS ordinateur (cible <0,1) | 0,408 | **0,327** |
| LCP mobile (cible <2,5 s) | 8,0 s | **8,4 s** |

La correction réserve de l'espace pour le premier rendu de l'annuaire afin de limiter les déplacements de contenu. Le LCP mobile reste trop lent, et les décalages de mise en page doivent encore baisser.

## Travail à poursuivre après validation des régressions
- Analyser la contribution de l'image la plus grande et de la construction des cartes au LCP mobile.
- Réduire les styles inutilisés (environ 73–78 Kio signalés).
- Examiner le chargement JSON et les portraits sans compromettre les fiches hors ligne.
- Vérifier le vrai fonctionnement hors connexion sur Android et Safari/iPhone.
- Comparer régulièrement la performance avec les rapports de la branche stable.

Ne pas interpréter ces scores comme une validation complète de l'expérience réelle.
