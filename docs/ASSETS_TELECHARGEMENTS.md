# Assets de telechargement

## Objectif

Eviter les doublons dans le dossier utilisateur en imposant une nomenclature stable pour tous les fichiers telecharges depuis les ateliers.

## Convention de nommage

- Fichier principal d'exercice :
  - `word-ex-003.docx`
  - `excel-ex-005.xlsx`
  - `powerpoint-ex-002.pptx`
- Fichier annexe :
  - `word-ex-003-annexe-1.zip`
  - `word-ex-003-annexe-2.jpg`
  - `excel-ex-005-annexe-1.png`

Regles :

- Prefixe app obligatoire : `word`, `excel`, `powerpoint`
- Numero d'exercice toujours sur 3 chiffres : `ex-001`
- Pas de sous-dossier par type (`workfiles`, `images`, etc.)
- Le dossier de module porte le slug du module : `m03-saisir-du-texte`
- Le fichier principal ne porte pas le suffixe `annexe-*`
- Tous les fichiers supplementaires d'un meme exercice utilisent `annexe-1`, `annexe-2`, etc.

## Arborescence cible

```text
assets/
  word/
    m03-saisir-du-texte/
      word-ex-003.docx
      word-ex-003-annexe-1.zip
  excel/
    m05-formules/
      excel-ex-005.xlsx
      excel-ex-005-annexe-1.png
  powerpoint/
    bases-diaporamas/
      powerpoint-ex-001.pptx
```

## Inventaire

Le fichier maitre est :

- `reports/download-assets-inventory.json`

Une version tableur est generee pour travail manuel :

- `reports/download-assets-inventory.xlsx`

Les telechargements source sont centralises dans un dossier mere dedie :

- `downloads-assets-source/`

Le script de recuperation y recree directement l'arborescence finale par app/module, sans le prefixe `assets/`.

Colonnes utiles :

- `app`
- `exerciseId`
- `moduleId`
- `moduleFolder`
- `slot`
- `sourceUrl`
- `suggestedFileName`
- `assetRelativePath`
- `driveModuleFolderId`
- `driveFileId`
- `driveViewUrl`
- `driveDownloadUrl`
- `assetUrl`

## Workflow Drive public

Si les fichiers sont ranges dans un Google Drive partage en lecture, l'inventaire peut etre enrichi automatiquement a partir du dossier racine Drive.

Exemple :

```bash
npm run assets:drive -- --root "https://drive.google.com/drive/folders/1jJmz7revwfH4mRXXlSTc4A85Y-i8HJQL"
```

Le script :

- retrouve les dossiers `word`, `excel`, `powerpoint`
- descend dans chaque dossier module attendu par l'inventaire
- cherche les fichiers par `suggestedFileName`
- renseigne `driveFileId`, `driveDownloadUrl` et `assetUrl`

Condition importante :

- le dossier Drive et ses sous-dossiers doivent etre accessibles en lecture par lien

## Workflow recommande

1. Generer ou regenerer l'inventaire.
2. Telecharger les fichiers source dans le dossier mere.
3. Le renommer avec `suggestedFileName`.
4. Verifier/ajuster sa place dans `downloads-assets-source/...`.
5. Enrichir l'inventaire depuis Drive public ou renseigner `assetUrl` manuellement.
6. Appliquer l'inventaire pour mettre a jour les URLs des apps.
7. Regenerer `exercises.js`.

## Commandes

Generer l'inventaire :

```bash
npm run assets:inventory
```

Recuperer les fichiers source :

```bash
npm run assets:fetch
```

Appliquer l'inventaire aux donnees :

```bash
npm run assets:apply
```

Enrichir automatiquement depuis Google Drive public :

```bash
npm run assets:drive -- --root "https://drive.google.com/drive/folders/..."
```

Puis regenerer les bundles de donnees :

```bash
npm run do sync
```
