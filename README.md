# RCC 2026

Site statique HTML/CSS/JavaScript du Racing Club Cubzaguais, hébergé sur Cloudflare Pages.

## Gestion des contenus

Le projet utilise Pages CMS.

1. Ouvrir https://app.pagescms.org
2. Se connecter avec GitHub
3. Choisir le dépôt `clementbesombes984-glitch/rcc2026`
4. Modifier les contenus déclarés dans `.pages.yml`

## Contenus éditables

- Matchs : `data/matches.json`
- Actualités : `data/news.json`
- Joueurs seniors : `data/senior.json`
- École de rugby : `data/academy.json`
- Pôle jeunes : `data/youth.json`
- Paramètres du club : `data/settings.json`

Les médias envoyés depuis Pages CMS sont stockés dans `assets/uploads`.

## Protection de l’accès Pages CMS

Le bouton `Pages CMS` du site pointe vers `/cms-login`.

Dans Cloudflare Pages, ajouter une variable d’environnement :

- `PAGES_CMS_PASSWORD` : mot de passe à donner aux personnes autorisées

Après validation du mot de passe, la page redirige vers https://app.pagescms.org/.

Important : Pages CMS reste aussi protégé par GitHub. Les personnes doivent avoir les droits nécessaires sur le dépôt pour modifier les contenus.
