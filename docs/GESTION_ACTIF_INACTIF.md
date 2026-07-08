# Gestion actif / inactif des modules et exercices

Cette V1 permet de masquer un module ou un exercice sans modifier les donnees source des exercices.

## Fichiers a modifier

- Word : `apps/word/data/availability-overrides.js`
- Excel : `apps/excel/data/availability-overrides.js`
- PowerPoint : `apps/powerpoint/data/availability-overrides.js`

Ces fichiers sont charges automatiquement par l'application.

## Format

Exemple general :

```js
window.WORD_ATELIER_AVAILABILITY_OVERRIDES = {
  modules: {
    "m29": { active: false },
  },
  exercises: {
    "ex-001": { active: false },
  },
};
```

Regles :

- `active: false` masque l'element.
- si un module est inactif, tous ses exercices deviennent indisponibles.
- si un exercice est inactif, seul cet exercice est masque.
- si un identifiant n'apparait pas dans le fichier, il reste actif.

## Desactiver un module

Exemple :

```js
window.WORD_ATELIER_AVAILABILITY_OVERRIDES = {
  modules: {
    "m29": { active: false },
  },
  exercises: {},
};
```

Effet :

- le module `m29` n'apparait plus dans l'atelier
- les exercices rattaches a `m29` n'apparaissent plus

## Desactiver un exercice

Exemple :

```js
window.WORD_ATELIER_AVAILABILITY_OVERRIDES = {
  modules: {},
  exercises: {
    "ex-001": { active: false },
  },
};
```

Effet :

- seul l'exercice `ex-001` est masque
- le reste du module reste visible

## Reactiver un element

Deux possibilites :

- supprimer la ligne correspondante du fichier
- ou mettre `active: true`

Exemple :

```js
"m29": { active: true }
```

## Comment trouver les identifiants

Pour les modules :

- regarder `id` dans `apps/<atelier>/data/exercises.structured.json`

Pour les exercices :

- regarder `id` dans `apps/<atelier>/data/exercises.structured.json`

Exemple de recherche :

- module : `"id": "m29"`
- exercice : `"id": "ex-001"`

## Apres modification

Si tu lances l'application depuis les fichiers sources de `apps/<atelier>`, la modification est prise en compte au rechargement de la page.

Si tu utilises aussi la copie distribuee dans `app/`, relancer :

- `npm run word:sync:app`
- `npm run excel:sync:app`
- `npm run powerpoint:sync:app`

## Limites de cette V1

- il n'y a pas encore d'interface formateur
- le pilotage se fait par fichier
- le reglage est global a l'atelier, pas encore par utilisateur

Cette approche est volontairement simple pour preparer une future couche formateur plus riche.
