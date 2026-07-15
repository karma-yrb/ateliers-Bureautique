# Audit restant

## Etat actuel

Le depot est propre sur les points suivants :

- `docs/` ne contient plus que de la documentation durable
- `reports/` contient les inventaires et rapports regenerables
- `logs/` et `backups/` ne sont plus conserves dans le depot
- la validation detecte les fichiers orphelins a la racine de `app/`

## Elements gardes intentionnellement

- `apps/*/data/assets/`
  - raison : contenu pedagogique distribue
  - cout : volume important du depot

- `apps/*/app/`
  - raison : artefact publie encore versionne
  - cout : duplication quasi complete de `data/`, `js/`, `styles` et `index`

- `apps/*/releases/` et `pages/releases/`
  - raison : historique de release expose a l'utilisateur

- `package-lock.json` racine + apps
  - raison : reproductibilite par perimetre

## Elements encore a surveiller

- `apps/*/scripts/maintenance/*`
  - a garder tant que le flux de scraping/revision reste utile
  - a supprimer si un atelier abandonne definitivement ce flux

- `styles-redesign-v2.css`
  - actuellement reference dans les `index.html`
  - donc a garder

- `README.txt` vs `app/README.txt`
  - duplication assumee
  - fonctions differentes : source de travail vs distribution

## Prochaine suppression non triviale

Le seul gros levier de reduction restant est la sortie de `apps/*/app/` du versionnement Git.
Ce chantier implique une adaptation du pipeline de publication et ne doit pas etre fait comme un simple nettoyage de fichiers.
