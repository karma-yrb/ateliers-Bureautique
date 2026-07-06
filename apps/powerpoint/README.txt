Atelier PowerPoint (MVC)

Application pedagogique PowerPoint issue du template Word.

Source cible des exercices :
https://www.clic-formation.net/tableur.html

Commandes principales depuis la racine :
- npm run powerpoint:test
- npm run powerpoint:build:data
- npm run powerpoint:sync:app

Source editable des exercices :
- data/exercises.structured.json

Flux standard :
- modifier data/exercises.structured.json
- npm run powerpoint:build:data -> regenere data/exercises.js pour le navigateur
- npm run powerpoint:sync:app -> recopie les donnees vers app/data
