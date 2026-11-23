# CLAUDE.md

Les règles du projet sont dans [AGENTS.md](./AGENTS.md). Les lire et les appliquer avant toute modification.

Rappel des trois règles essentielles :
1. Jamais de commit ni de poussée sur `main` : une branche, puis une pull request, sans fusion.
2. Tous les tests (Node et Python) doivent passer avant la pull request, et on ne déclare jamais un test exécuté s'il ne l'a pas été.
3. Toute publication met à jour `VERSION` dans `sw.js`, les paramètres `?v=` et `CHANGELOG.md`.
