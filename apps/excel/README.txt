Atelier Excel (MVC)

Ce fichier documente la source de travail dans `apps/excel/`.
Le fichier `app/README.txt` documente, lui, la version distribuable destinee au poste utilisateur.

Application pedagogique Excel issue du template Word.

Source cible des exercices :
https://www.clic-formation.net/tableur.html

Commandes principales depuis la racine :
- npm run excel:test
- npm run excel:build:data
- npm run excel:sync:app

Source editable des exercices :
- data/exercises.structured.json

Flux standard :
- modifier data/exercises.structured.json
- npm run excel:build:data -> regenere data/exercises.js pour le navigateur
- npm run excel:sync:app -> recopie les donnees vers app/data

Scripts presents dans `scripts/` :
- flux courant : `build-data-js`, `sync-app`, `validate-encoding`, `repair-encoding`
- publication : `run-release-all`, `release-all.sh`, `update-release-artifacts`, `validate-release-*`, `standard-version-*`
- maintenance de contenu : `maintenance/scrape-exercises.mjs`, `maintenance/revise-exercises.mjs`, `maintenance/audit-exercises.mjs`
