# Liaison Studio RCC / Meta

Le Studio RCC est préparé pour devenir le centre de diffusion du club vers le site, Facebook, Instagram et les notifications push.

## État actuel

- L'interface du Studio propose les canaux de diffusion.
- Les aperçus Site, Facebook, Instagram et Notification Push sont générés automatiquement.
- Les textes Facebook / Instagram et les hashtags peuvent être copiés manuellement.
- Les endpoints Cloudflare Pages Functions existent, mais ne publient rien tant que Meta n'est pas configuré.
- Aucun token Meta n'est présent dans le code.

## Variables Cloudflare prévues

À configurer plus tard dans Cloudflare Pages, jamais dans le dépôt :

- `META_APP_ID`
- `META_APP_SECRET`
- `META_PAGE_ID`
- `META_IG_USER_ID`
- `META_ACCESS_TOKEN`

## Endpoints disponibles

- `GET /api/meta/status`
- `POST /api/meta/facebook`
- `POST /api/meta/instagram`

`/api/meta/status` retourne :

```json
{
  "metaConfigured": false,
  "facebookReady": false,
  "instagramReady": false,
  "missingSecrets": []
}
```

## Activation future

Quand les permissions Meta seront validées :

1. Ajouter les variables d'environnement dans Cloudflare Pages.
2. Brancher l'appel Graph API Facebook dans `integrations/meta/facebook.js`.
3. Brancher le workflow Instagram Graph API dans `integrations/meta/instagram.js` :
   - création du media container ;
   - publication du media container.
4. Ajouter un stockage serveur si l'historique doit être partagé entre plusieurs ordinateurs.

Le mode manuel reste disponible quoi qu'il arrive : télécharger l'image, copier le texte, copier les hashtags.
