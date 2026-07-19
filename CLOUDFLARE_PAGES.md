# Configuration Cloudflare Pages

Ce projet doit etre deploye comme un projet **Cloudflare Pages**, pas comme un **Cloudflare Worker** standalone.

## Reglage important

Si Cloudflare affiche :

```text
Deploy command:
npx wrangler deploy
```

ce n'est pas le bon reglage pour ce projet.

Il faut supprimer ce deploy command. Sinon Wrangler essaie de deployer le depot complet comme un Worker et peut embarquer `node_modules`, ce qui provoque l'erreur :

```text
Asset too large
node_modules/workerd/bin/workerd
```

Il faut utiliser Cloudflare Pages avec :

- site statique a la racine du depot ;
- dossier `functions/` pour les Pages Functions ;
- GitHub comme source de deploiement.

## Reglages Pages recommandes

Dans Cloudflare Pages > projet `rcc2026` :

- Framework preset : `None`
- Build command : `npm install && npm run build`
- Deploy command : laisser vide
- Build output directory : `/`
- Root directory : laisser vide, sauf si Cloudflare demande le dossier racine du depot
- Functions directory : `functions`
- Compatibility flag : `nodejs_compat`

Le fichier `wrangler.toml` du depot fixe aussi cette compatibilite cote Pages Functions :

```toml
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "."
```

Il ne faut pas ajouter de commande `wrangler deploy` pour autant.

Le deploiement doit etre fait par Cloudflare Pages automatiquement depuis GitHub, pas par `npx wrangler deploy`.

Les notifications utilisent l'API Web Crypto native de Cloudflare Workers. Aucune dependance Node `web-push` n'est necessaire.

## Variables d'environnement Cloudflare

Ajouter dans Cloudflare Pages :

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `PUSH_ADMIN_TOKEN`
- `PAGES_CMS_PASSWORD` : mot de passe administrateur obligatoire
- `ADMIN_SESSION_SECRET` : secret obligatoire d'au moins 32 caracteres, distinct du mot de passe administrateur
- `RCC_GITHUB_TOKEN` : token GitHub permettant au Studio RCC de creer directement un article dans `data/news.json`

Pour `RCC_GITHUB_TOKEN`, utiliser Cloudflare Pages > Settings > Environment variables.
Sans cette variable, le Studio RCC peut preparer les visuels mais ne peut pas publier un article sur le site.

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

- `RCC_SITE_URL` : URL publique du site, par exemple `https://rccubzaguais.fr`
- `RCC_PUSH_ADMIN_TOKEN` : meme valeur que `PUSH_ADMIN_TOKEN` dans Cloudflare

## Test apres deploiement

Ces URL doivent repondre :

```text
https://rccubzaguais.fr/api/push/config
https://rccubzaguais.fr/cms-login
```

Si `/api/push/config` donne une erreur 404, les Pages Functions ne sont pas deployees.

Si `/api/push/config` repond mais `enabled` vaut `false`, il manque `VAPID_PUBLIC_KEY` dans Cloudflare.
