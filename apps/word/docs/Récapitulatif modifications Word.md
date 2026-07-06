# Récapitulatif des modifications - App Word

## Backup

Un backup complet de l'application Word a été créé ici :

- `backups/word-app-20260706-141316`

---

## Exercices modifiés par module

## W17 - WordArt et Lettrine

### Exercices modifiés

- `ex-036`
- `ex-038`

### Exercice supprimé

- `ex-037`

### Modifications appliquées

- réécriture des consignes WordArt pour les rendre compatibles avec Word LTSC 2024 / Microsoft 365 ;
- suppression des formulations dépendantes d'anciens styles Office ;
- clarification des objectifs visuels attendus ;
- ajout de critères de réussite plus explicites ;
- suppression propre de `ex-037`, exercice devenu non souhaité dans le dataset.

---

## W12 - Insérer une image

### Exercices modifiés

- `ex-068`
- `ex-069`
- `ex-070`

### Modifications appliquées

- modernisation des consignes autour de l'habillage et du positionnement des images ;
- ajout d'alternatives compatibles quand un visuel, un style ou une commande varie selon la version de Word ;
- clarification des attentes de mise en page ;
- reformulation de l'exercice vidéo pour tenir compte des environnements où `Vidéo en ligne` n'est pas disponible.

---

## W21 - SmartArt

### Exercices modifiés

- `ex-128`
- `ex-129`
- `ex-130`
- `ex-131`
- `ex-132`
- `ex-133`

### Modifications appliquées

- réécriture des consignes SmartArt pour qu'elles soient plus guidées et plus pédagogiques ;
- suppression des formulations incomplètes ou trop brutes ;
- assouplissement des références à des styles exacts d'Office ;
- recentrage des exercices sur la structure, la lisibilité et la proximité avec le modèle plutôt que sur un style strictement identique.

---

## W22 - Modèles

### Exercices modifiés

- `ex-134`
- `ex-135`

### Modifications appliquées

- mise à jour du vocabulaire lié aux modèles Word ;
- clarification des consignes d'enregistrement selon les formats compatibles (`.dotx`, `.dot`, `.docx`) ;
- meilleure adaptation aux versions récentes de Word et à leurs emplacements de stockage.

---

## W23 - Styles

### Exercices modifiés

- `ex-138`
- `ex-139`
- `ex-140`

### Modifications appliquées

- suppression des références trop spécifiques à Office 2013 ;
- reformulation des consignes pour accepter les variations de noms de styles selon la version de Word ;
- ajout d'instructions plus claires pour la création de styles personnalisés.

---

## Liste complète des exercices touchés

### Modifiés

- `ex-036`
- `ex-038`
- `ex-068`
- `ex-069`
- `ex-070`
- `ex-128`
- `ex-129`
- `ex-130`
- `ex-131`
- `ex-132`
- `ex-133`
- `ex-134`
- `ex-135`
- `ex-138`
- `ex-139`
- `ex-140`

### Supprimé

- `ex-037`

---

## Fichiers impactés

- `apps/word/data/exercises.structured.json`
- `apps/word/data/exercises.js`
- `apps/word/app/data/exercises.structured.json`
- `apps/word/app/data/exercises.js`

---

## Vérifications réalisées

- génération des données : OK
- synchronisation de l'app : OK
- validation d'encodage : OK
- tests : `31/31` OK
