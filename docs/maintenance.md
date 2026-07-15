# Maintenance du site RCC

Ce document résume les points utiles pour maintenir le site officiel du Racing Club Cubzaguais.

## Structure du projet

- Pages publiques : fichiers HTML à la racine (`index.html`, `actualites.html`, `calendrier.html`, `equipes.html`, etc.).
- Styles : `styles.css`.
- Scripts publics : `script.js`, `data-loader.js`, `matches-view.js`, `notifications.js`.
- Studio RCC : dossier `admin/`.
- Données éditables : dossier `data/`.
- Images et médias : dossier `assets/`, principalement `assets/uploads/`.
- Cloudflare Pages Functions : dossier `functions/`.
- PWA : `manifest.webmanifest` et `sw.js`.

## Données principales

- Actualités : `data/news.json`.
- Calendrier : `data/matches.json`.
- Seniors : `data/senior.json`.
- École de Rugby : `data/academy.json`.
- Pôle Jeunes : `data/youth.json`.
- Cadettes : `data/feminines.json`.
- Galerie : `data/gallery.json`.
- Boutique : `data/shop.json`.
- Partenaires : `data/partners.json`.
- Newsletters : `data/newsletters.json`.
- Bureau / RCC Demain : `data/bureau.json`.
- Postes rugby officiels : `data/rugby-positions.json`.

## Modifier la saison

La saison du Studio RCC est centralisée dans `admin/poster-generator.js` avec la constante `CURRENT_SEASON`.

## Ajouter une actualité

Utiliser Pages CMS ou le Studio RCC. Les actualités sont enregistrées dans `data/news.json`.

Champs importants :
- `title`
- `summary`
- `body`
- `image`
- `category`
- `audience`
- `important`
- `notification`

## Ajouter un joueur senior

Utiliser Pages CMS dans la rubrique Seniors.

Champs importants :
- `firstName`
- `lastName`
- `primaryPosition`
- `secondaryPosition`
- `photo`
- `active`

Le poste principal est obligatoire. L’ancien champ `position` reste compatible pour les anciennes données.

## Ajouter une newsletter

Les archives sont dans `data/newsletters.json`.

Les fichiers PDF et couvertures doivent être placés dans `assets/newsletters/`.

## Créer une composition

Utiliser le Studio RCC, onglet Compositions. Les joueurs seniors sont proposés selon leur poste principal, puis secondaire.

## Variables d’environnement Cloudflare

À configurer dans Cloudflare Pages :

- `PAGES_CMS_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `RCC_GITHUB_TOKEN`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `PUSH_ADMIN_TOKEN`

Secrets GitHub Actions :

- `RCC_SITE_URL`
- `RCC_PUSH_ADMIN_TOKEN`

## Déploiement Cloudflare

Le projet doit rester un projet Cloudflare Pages.

- Build command : `npm install && npm run build`
- Deploy command : vide
- Output directory : `/`
- Functions directory : `functions`

Ne pas utiliser `npx wrangler deploy` pour ce site.

## Commandes Git utiles

```bash
git status
git add .
git commit -m "Message clair"
git pull --rebase origin main
git push origin main
```

## Points d’extension futurs

- Nouveaux modèles d’affiches dans le Studio RCC.
- Programmation des publications.
- Connexion Meta complète.
- Médiathèque plus avancée.
- Gestion de plusieurs administrateurs.
- Historique enrichi des publications.
