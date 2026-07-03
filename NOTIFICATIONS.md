# Notifications push RCC

Le site RCC est maintenant pret cote PWA pour les notifications push, tout en restant un site statique compatible Cloudflare Pages.

## Ce qui est deja en place

- Une page `notifications.html` permet aux visiteurs de choisir les categories qu'ils veulent suivre.
- Les preferences sont enregistrees localement dans `localStorage`.
- Le bouton `Activer les notifications` demande l'autorisation uniquement apres un clic utilisateur.
- `notifications.js` verifie la compatibilite du navigateur et affiche un etat clair.
- Si une cle publique VAPID est ajoutee plus tard, `notifications.js` peut creer un vrai abonnement Web Push.
- `sw.js` contient les evenements `push` et `notificationclick`.
- Au clic sur une notification, l'utilisateur est dirige vers la bonne page :
  - actualite : `/actualites.html`
  - match ou resultat : `/#matches`
  - galerie : `/galerie.html`
  - contact / nous rejoindre : `/nous-rejoindre.html`
- Pages CMS permet de renseigner `notification` et `audience` pour les actualites et les matchs.

## Limite actuelle

Un site statique ne peut pas envoyer seul des notifications push.

Il manque encore un service serveur pour :

1. enregistrer les abonnements push des utilisateurs ;
2. stocker les preferences associees ;
3. detecter les nouvelles actualites ou nouveaux matchs ;
4. envoyer les notifications aux bons utilisateurs.

Le code actuel ne casse rien si ce backend n'existe pas. Il prepare simplement le terrain.

## Option 1 : Cloudflare Worker + Web Push

Architecture recommandee si le site reste chez Cloudflare :

1. Creer des cles VAPID Web Push.
2. Ajouter la cle publique cote site, par exemple :

```html
<meta name="web-push-public-key" content="CLE_PUBLIQUE_VAPID" />
```

ou definir :

```js
window.RCC_PUSH_PUBLIC_KEY = 'CLE_PUBLIQUE_VAPID';
```

3. Ajouter un endpoint Worker `/api/push/subscribe`.
4. Quand l'utilisateur clique sur `Activer les notifications`, envoyer son abonnement et ses preferences au Worker.
5. Stocker les abonnements dans Cloudflare KV, D1 ou R2.
6. Ajouter un endpoint Worker `/api/push/send`.
7. A chaque modification de `data/news.json` ou `data/matches.json`, declencher l'envoi via GitHub Actions ou un webhook.
8. Le Worker filtre les abonnements selon `audience` et envoie uniquement aux personnes concernees.

Exemple de payload attendu par `sw.js` :

```json
{
  "type": "news",
  "title": "Plateau U8 samedi",
  "body": "Rendez-vous au stade a 10h.",
  "audience": ["u8", "ecole", "matchs"],
  "url": "/actualites.html"
}
```

## Option 2 : Firebase Cloud Messaging

Architecture possible :

1. Creer un projet Firebase.
2. Activer Firebase Cloud Messaging.
3. Ajouter la configuration Firebase cote navigateur.
4. Recuperer le token FCM apres clic utilisateur.
5. Stocker le token et les preferences dans Firestore ou une base equivalente.
6. Envoyer les notifications via Cloud Functions, GitHub Actions ou un serveur externe.

Cette option est pratique si le club veut ensuite une interface plus avancee pour envoyer des messages.

## Declenchement depuis Pages CMS

Pages CMS modifie les fichiers JSON dans GitHub.

Pour envoyer automatiquement une notification quand une actu ou un match est publie :

1. Ajouter une GitHub Action declenchee sur push.
2. Comparer les anciennes et nouvelles versions de :
   - `data/news.json`
   - `data/matches.json`
3. Chercher les entrees avec :
   - `notification: true`
   - `audience` renseigne
4. Appeler le backend choisi avec le titre, le resume, le type et les audiences.
5. Le backend envoie aux utilisateurs dont les preferences correspondent.

## Audiences disponibles

- `general`
- `seniors`
- `feminines`
- `u6`
- `u8`
- `u10`
- `u12`
- `u14`
- `u16`
- `u19`
- `ecole`
- `jeunes`
- `benevoles`
- `partenaires`
- `evenements`
- `matchs`
- `resultats`
- `entrainements`
- `important`

## A ne pas faire

- Ne pas demander l'autorisation de notification automatiquement au chargement.
- Ne pas envoyer toutes les notifications a tout le monde.
- Ne pas supprimer les preferences locales sans action utilisateur.
- Ne pas casser le fonctionnement statique du site si le backend est indisponible.
