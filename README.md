# ConvocUNSS

Application web (PWA, utilisable hors ligne) qui génère en PDF les **convocations des compétitions UNSS** : 4 convocations A6 par page A4, prêtes à découper.

**Adresse :** https://vinztoc.github.io/ConvocUNSS/

## Fonctionnement
1. Renseigner la compétition (activité, date, lieu, rendez-vous, retour, accompagnateur, informations).
2. Ajouter le logo de l'établissement et celui de l'AS (le logo officiel UNSS est placé à droite du logo AS). Les logos restent mémorisés sur l'appareil.
3. Importer l'export des inscrits du site UNSS (.xlsx, .xls, .csv) : Nom, Prénom, Classe, Catégorie et Activité sont détectés automatiquement. On peut aussi choisir les élèves dans la liste de Mes Apps EPS ou les saisir à la main.
4. Générer le PDF (option : liste récapitulative pour l'appel / la vie scolaire).

## Intégration à Mes Apps EPS
- `eps-core.js` est chargé : identifiant d'application **`convocunss`** (mode « lignes »).
- Chaque convocation est ajoutée à la fiche de l'élève (`Date`, `Activité`, `Lieu`, `Rendez-vous`, `Retour`, `Catégorie`).
- « Exporter (.xlsx) » produit un classeur au format Mes Apps EPS ; « Charger la liste » accepte le .xlsx/.csv du portail.
- Les classes absentes de l'export UNSS sont complétées depuis la liste Pronote du portail.

Ligne à ajouter dans `apps.json` du portail :
```json
{"id":"convocunss","nom":"ConvocUNSS","desc":"Générer les convocations PDF des compétitions UNSS à partir de l'export des inscrits","url":"https://vinztoc.github.io/ConvocUNSS/","icon":"icons/icon-192-ConvocUNSS.png","emoji":"🏆","couleur":"#b030ff,#6a0fd0","categorie":"Gestion","auteur":"Vincent TOCQUIN"}
```

## Fichiers
`index.html`, `style.css`, `app.js`, `eps-core.js`, `version.js` (numéro de version, à incrémenter à chaque mise à jour), `sw.js`, `manifest.webmanifest`, `lib/` (jsPDF 2.5.2, SheetJS 0.18.5, copiés localement pour le hors-ligne), `icons/`.

Données 100 % locales (aucun envoi sur un serveur).
