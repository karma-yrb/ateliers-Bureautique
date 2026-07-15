# Conventions du repo

## Objectif

Ce document fixe ce qui doit etre :

- versionne comme source canonique
- versionne comme artefact publie assume
- genere localement ou en CI
- ignore et non conserve dans le depot

## A versionner

### Sources canoniques

- `apps/*/data/` hors `app/`
- `apps/*/js/` hors `app/`
- `apps/*/index.html`
- `apps/*/styles.css`
- `apps/*/styles-redesign-v2.css`
- `apps/*/deployment-config.json`
- `apps/*/releases/`
- `apps/*/README.txt`
- `apps/*/package.json`
- `apps/*/package-lock.json`
- `packages/atelier-core/`
- `pages/`
- `docs/`
- `reports/`
- scripts racine et scripts d'app necessaires au build, a la sync et a la release

### Artefacts publies assumes

- `apps/*/app/`

Ce dossier reste versionne tant que le pipeline de publication GitHub Pages depend de son contenu.
Il ne doit pas etre modifie a la main ; il doit etre regenere via les scripts de sync prevus.

## A regenerer plutot qu'editer a la main

- `apps/*/data/exercises.js`
- `apps/*/app/data/*`
- `apps/*/app/js/*`
- `apps/*/app/index.html`
- `apps/*/app/styles*.css`
- `apps/*/app/releases/*`
- `reports/*.json`
- `reports/*.md`
- `reports/*.xlsx`
- pages de releases generees

## A ne pas conserver dans le depot

- `backups/`
- `logs/`
- `**/logs/`
- fichiers temporaires locaux
- exports intermediaires recreables non documentes

## Regles pratiques

1. Modifier d'abord la source canonique.
2. Regenerer ensuite les artefacts (`build:data`, `sync:app`, scripts de release).
3. Ne pas corriger manuellement `app/` pour contourner une source incorrecte.
4. Tout nouveau rapport regenerable va dans `reports/`, pas dans `docs/`.
5. Toute nouvelle documentation durable va dans `docs/`, pas dans `reports/`.
6. Tout nouveau dossier local de travail doit etre ajoute au `.gitignore` avant usage regulier.

## Points actuellement assumes

- Les `package-lock.json` de la racine et des apps sont conserves pour figer les environnements par perimetre.
- Les assets pedagogiques dans `apps/*/data/assets/` sont conserves car ils font partie du contenu livre.
- Les fichiers `releases/*` sont conserves car ils sont publies et utilises par l'interface.

## Evolution cible

La cible a moyen terme serait de ne plus versionner `apps/*/app/` et de le generer avant publication.
Tant que cette migration n'est pas faite, la discipline de sync et de validation reste obligatoire.
