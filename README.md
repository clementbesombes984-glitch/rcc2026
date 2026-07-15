# RCC 2026

Site statique HTML/CSS/JavaScript du Racing Club Cubzaguais, hébergé sur Cloudflare Pages.

## Déploiement Cloudflare

Ce projet doit être déployé avec **Cloudflare Pages**, pas avec un Worker standalone.

Ne pas utiliser :

```bash
npx wrangler deploy
```

Dans Cloudflare Pages, le champ `Deploy command` doit rester vide. Si ce champ contient `npx wrangler deploy`, Cloudflare essaiera de deployer le projet comme un Worker et pourra echouer avec `Asset too large` sur `node_modules`.

Le champ `Build command` doit etre :

```bash
npm install && npm run build
```

Cette commande lance la verification minimale du site statique avant le deploiement.

Le dossier `functions/` contient des **Cloudflare Pages Functions** pour l'administration et les notifications.

Voir la configuration complète dans `CLOUDFLARE_PAGES.md`.

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
- `ADMIN_SESSION_SECRET` : secret long recommandé pour signer les sessions admin

Après validation du mot de passe, la page redirige vers https://app.pagescms.org/.

Important : Pages CMS reste aussi protégé par GitHub. Les personnes doivent avoir les droits nécessaires sur le dépôt pour modifier les contenus.

Voir aussi `docs/maintenance.md` pour la structure du projet, les données éditables et les commandes utiles.
