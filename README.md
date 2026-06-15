# Ateliers Bureautique

Monorepo des ateliers bureautiques.

## Applications

- `apps/word` : atelier Word actuel, versionné indépendamment.

## Commandes

Depuis la racine :

- `npm run word:test`
- `npm run word:build:data`
- `npm run word:sync:app`
- `npm run word:audit:data`
- `npm run word:release`
- `npm run word:release:all`

Depuis `apps/word`, les commandes historiques restent disponibles (`npm test`, `npm run build:data`, etc.).

## Organisation cible

- `apps/*` : applications finales (`word`, puis `excel`, `powerpoint`, etc.).
- `packages/*` : code commun extrait progressivement.

