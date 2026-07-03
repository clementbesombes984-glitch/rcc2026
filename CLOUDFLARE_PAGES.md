# Configuration Cloudflare Pages

Ce projet doit etre deploye comme un projet **Cloudflare Pages**, pas comme un **Cloudflare Worker** standalone.

## Reglage important

Si Cloudflare affiche :

```text
Deploy command:
npx wrangler deploy
```

ce n'est pas le bon type de deploiement pour ce projet.

Il faut utiliser Cloudflare Pages avec :

- site statique a la racine du depot ;
- dossier `functions/` pour les Pages Functions ;
- GitHub comme source de deploiement.

## Reglages Pages recommandes

Dans Cloudflare Pages > projet `rcc2026` :

- Framework preset : `None`
- Build command : `npm install`
- Build output directory : `/`
- Root directory : laisser vide, sauf si Cloudflare demande le dossier racine du depot
- Functions directory : `functions`
- Compatibility flag : `nodejs_compat`

## Variables d'environnement Cloudflare

Ajouter dans Cloudflare Pages :

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `PUSH_ADMIN_TOKEN`
- `PAGES_CMS_PASSWORD`

Les valeurs VAPID sont dans le fichier local non publie :

```text
vapid.local.txt
```

## Binding KV

Creer un KV namespace Cloudflare puis ajouter un binding au projet Pages :

```text
RCC_PUSH_SUBSCRIPTIONS
```

Le nom du binding doit etre exactement celui-ci, car le code utilise :

```js
env.RCC_PUSH_SUBSCRIPTIONS
```

## Secrets GitHub Actions

Dans GitHub > Settings > Secrets and variables > Actions, ajouter :

- `RCC_SITE_URL` : URL publique du site, par exemple `https://rcc2026.pages.dev`
- `RCC_PUSH_ADMIN_TOKEN` : meme valeur que `PUSH_ADMIN_TOKEN` dans Cloudflare

## Test apres deploiement

Ces URL doivent repondre :

```text
https://rcc2026.pages.dev/api/push/config
https://rcc2026.pages.dev/cms-login
```

Si `/api/push/config` donne une erreur 404, les Pages Functions ne sont pas deployees.

Si `/api/push/config` repond mais `enabled` vaut `false`, il manque `VAPID_PUBLIC_KEY` dans Cloudflare.
