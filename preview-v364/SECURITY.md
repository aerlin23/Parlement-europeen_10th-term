# Confidentialité et sécurité du Vademecum PE

Le dépôt GitHub Pages et son historique Git sont **publics**. Les boutons masqués, fichiers non indexés et options locales ne constituent pas un contrôle d’accès.

## Données à ne jamais publier
- Listes téléphoniques internes, annuaires nominatifs et fichiers de service non autorisés.
- Archives de cavaliers privés, PDF internes, exports Excel de réunions et coordonnées personnelles.
- Identifiants, jetons, mots de passe, clés d’API et fichiers de configuration secrets.

Les documents personnels sont importés volontairement dans le navigateur et restent sur l’appareil dans les stockages web (LocalStorage/IndexedDB). Ces mécanismes ne chiffrent pas les données et ne protègent pas un appareil partagé ou compromis. La suppression des données du site peut effacer des favoris ou imports.

## Risques résiduels
- L’adresse de contact affichée publiquement peut être collectée automatiquement.
- Le code contient des fonctionnalités expérimentales personnelles ; seule la bibliothèque locale n’est pas publiée.
- Les images et ressources officielles proviennent de tiers soumis à leurs propres conditions.
- Une politique CSP stricte exige la réduction des scripts et styles intégrés et le traitement de certaines bibliothèques tierces. Ne pas ajouter de CSP bloquante sans tests.
- Les fichiers supprimés d’une branche restent accessibles dans l’historique Git et parfois dans les caches et forks. En cas de fuite, il faut révoquer les secrets et envisager une purge d’historique appropriée.

## Publication
1. Examiner les fichiers ajoutés, y compris archives, données et métadonnées.
2. Ne jamais inclure une bibliothèque de contacts privés dans le dépôt.
3. Exécuter les tests de non-régression et de détection des secrets.
4. Vérifier les dépendances documentaires et leurs licences.
5. Publier uniquement après revue des modifications.
