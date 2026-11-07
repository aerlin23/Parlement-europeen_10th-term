# Parlement-europ-en_10th-term

Annuaire des 720 députés en fonction récupérés le 6 novembre 2026, avec filtres groupe européen, parti national, pays, genre, fonction et commission, et quiz à choix multiples privilégiant des noms ressemblants, du même pays et du même genre.

## Sources

- Liste et partis nationaux : https://www.europarl.europa.eu/meps/en/full-list/xml
- Noms de famille, groupes, genre : https://data.europarl.europa.eu/api/v2/meps/show-current (JSON-LD, filtre gender=FEMALE ou MALE ; pagination de 100).
- Présidence du Parlement : fiche et API officielle de Roberta Metsola.
- Fonctions de groupe : données sourcées de nos annuaires ESN et Patriotes. Couverture partielle, explicitement indiquée sur le site.

Les photos sont fournies par le Parlement européen. Les liens individuels ouvrent les fiches officielles.

## Mettre à jour

Le fichier members.json est distinct de ceux des deux annuaires de groupe. L’export/import dans la page permet de vérifier un JSON avant de remplacer ce fichier sur GitHub. Les données ne se synchronisent pas automatiquement. Ne pas déduire le genre du nom ou de la photo ; utiliser les données officielles. Conserver les sources et dates des fonctions et supprimer celles qui ne sont plus actuelles.

Site : https://aerlin23.github.io/Parlement-europeen_10th-term/

Publication : Settings → Pages → Deploy from a branch → main → / (root).
