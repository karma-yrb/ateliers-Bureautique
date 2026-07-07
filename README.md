# Ateliers Bureautique

Monorepo des ateliers bureautiques.

## Applications

- `apps/word` : atelier Word actuel, versionne independamment.
- `apps/excel` : atelier Excel aligne maintenant son flux de donnees sur Word.
- `apps/powerpoint` : atelier PowerPoint base sur le meme socle partage.
- `pages/` : accueil commun et version produit globale affichee a l'utilisateur.

## URLs publiees

- `/word/` : atelier Word.
- `/excel/` : atelier Excel.
- `/powerpoint/` : atelier PowerPoint.
- `/` : choix de l'atelier.
- `/releases/` : releases globales Ateliers Bureautique.

## Commandes

Depuis la racine :

- `npm run core:test`
- `npm run release`
- `npm run release:first`
- `npm run word:test`
- `npm run word:build:data`
- `npm run word:sync:app`
- `npm run word:release`
- `npm run word:release:all`
- `npm run excel:test`
- `npm run excel:build:data`
- `npm run excel:sync:app`
- `npm run powerpoint:test`
- `npm run powerpoint:build:data`
- `npm run powerpoint:sync:app`

Depuis `apps/word` ou `apps/excel`, les commandes locales restent disponibles (`npm test`, `npm run build:data`, etc.).
Depuis `apps/powerpoint`, les memes commandes locales sont aussi disponibles.

## Architecture partagee

Le socle commun vit maintenant dans `packages/atelier-core` :

- `browser/` : runtime navigateur partage, synchronise vers `apps/*/js/core/`
- `scripts/` : sync, validation, release et helpers de build communs
- `tests/shared/` : contrats de test reutilises par Word et Excel
- `runtime-contract.mjs` : ordre de chargement des scripts partages

Chaque app garde seulement ce qui lui est propre :

- `apps/*/data/` pour les exercices et assets
- `apps/*/js/app-config.js` pour les noms globaux et la configuration de stockage
- quelques wrappers de scripts dans `apps/*/scripts/`

## Versionnement

- Une version produit globale est portee par la racine du monorepo et affichee sur `pages/index.html`.
- Les versions `word-v...`, `excel-v...` et `powerpoint-v...` restent des versions techniques par module.
- `npm run release:all` publie les modules necessaires puis termine par la release globale `bureautique-v...`.

La note d'architecture detaillee est dans `packages/atelier-core/ARCHITECTURE.md`.

## Flux recommande

1. Modifier la logique partagee dans `packages/atelier-core`
2. Relancer `npm run word:sync:app` ou `npm run excel:sync:app`
3. Verifier avec `npm run core:test`, puis `npm run word:test` et/ou `npm run excel:test`

Pour Word, le flux de donnees a ete simplifie :

- la source editable est `apps/word/data/exercises.structured.json`
- `npm run word:build:data` regenere `apps/word/data/exercises.js`
- les anciens scripts Word de scraping, revision et audit ont ete retires

Pour Excel, le flux standard suit maintenant la meme logique :

- la source editable est `apps/excel/data/exercises.structured.json`
- `npm run excel:build:data` regenere `apps/excel/data/exercises.js`
- `npm run excel:sync:app` copie les donnees et fichiers distribues vers `apps/excel/app`

## Organisation cible

- `apps/*` : applications finales (`word`, `excel`, puis `powerpoint`, etc.).
- `packages/atelier-core` : scripts communs (`build-data`, `sync-app`, validation encodage) et runtime navigateur partagé (`model`, `storage`, `view`, `controller`) par les ateliers.
- `packages/*` : autres codes communs à extraire progressivement.
