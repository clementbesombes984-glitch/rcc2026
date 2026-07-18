# Notifications push RCC

Le site RCC est maintenant pret cote PWA pour les notifications push, tout en restant un site statique compatible Cloudflare Pages.

## Ce qui est deja en place

- Une page `notifications.html` permet aux visiteurs de choisir les categories qu'ils veulent suivre.
- Les preferences sont enregistrees localement dans `localStorage`.
- Le bouton `Activer les notifications` demande l'autorisation uniquement apres un clic utilisateur.
- Un bouton `Tester` permet de verifier que le navigateur affiche bien les notifications.
- Un bouton `Verifier maintenant` cherche un contenu avec `notification: true` correspondant aux preferences et tente d'afficher une notification.
- Un bouton `Reparer l'application` vide le cache PWA et force le navigateur a reprendre les derniers fichiers.
- Tant que l'application est ouverte, `notifications.js` surveille `data/news.json` et `data/matches.json`.
- Si une nouvelle entree porte `notification: true` et correspond aux preferences locales, une notification locale est affichee.
- `notifications.js` verifie la compatibilite du navigateur et affiche un etat clair.
- Si une cle publique VAPID est ajoutee plus tard, `notifications.js` peut creer un vrai abonnement Web Push.
- `sw.js` contient les evenements `push` et `notificationclick`.
- Au clic sur une notification, l'utilisateur est dirige vers la bonne page :
  - actualite : `/actualites.html`
  - match ou resultat : `/#matches`
  - galerie : `/galerie.html`
  - contact / nous rejoindre : `/nous-rejoindre.html`
- Pages CMS permet de renseigner `notification` et `audience` pour les actualites et les matchs.

## Envoi reel avec Cloudflare Pages

Le projet contient maintenant une base serveur pour les vraies notifications push :

- `/api/push/config` donne la cle publique VAPID au navigateur ;
- `/api/push/subscribe` enregistre les appareils dans un KV Cloudflare ;
- `/api/push/send` envoie une notification aux abonnes correspondant aux audiences ;
- `.github/workflows/notify.yml` declenche l'envoi quand `data/news.json` ou `data/matches.json` change ;
- `scripts/notify-changes.js` detecte les nouvelles entrees avec `notification: true`.

Pour que cela fonctionne en production, il faut configurer Cloudflare et GitHub.

### 1. Creer les cles VAPID

Depuis le dossier du projet :

Generer les cles VAPID avec un outil local ou un generateur compatible Web Push, puis conserver uniquement les valeurs dans Cloudflare.

Garder la cle publique et la cle privee.

### 2. Configurer Cloudflare Pages

Dans Cloudflare Pages, projet RCC :

1. Creer un KV namespace, par exemple `RCC_PUSH_SUBSCRIPTIONS`.
2. Ajouter le binding KV au projet Pages avec le nom exact :
   `RCC_PUSH_SUBSCRIPTIONS`
3. Dans les reglages de build, laisser Cloudflare installer les dependances npm du projet.
4. Dans les reglages Functions / Compatibility, conserver le flag :
   `nodejs_compat`
5. Ajouter les variables d'environnement :
   - `VAPID_PUBLIC_KEY` : cle publique VAPID
   - `VAPID_PRIVATE_KEY` : cle privee VAPID
   - `VAPID_SUBJECT` : par exemple `mailto:lerccdemain@gmail.com`
   - `PUSH_ADMIN_TOKEN` : mot de passe long et secret pour autoriser l'envoi

Redeployer ensuite le site.

### 3. Configurer GitHub

Dans le depot GitHub, ajouter les secrets Actions :

- `RCC_SITE_URL` : URL du site, par exemple `https://rccubzaguais.fr`
- `RCC_PUSH_ADMIN_TOKEN` : exactement la meme valeur que `PUSH_ADMIN_TOKEN` dans Cloudflare

Quand Pages CMS modifiera `data/news.json` ou `data/matches.json`, GitHub Actions appellera `/api/push/send`.

### 4. Cote Pages CMS

Pour qu'une entree parte en notification :

- mettre `notification: true` ;
- renseigner `audience` ;
- publier une nouvelle entree ou modifier suffisamment le titre/date/equipe pour qu'elle soit detectee comme nouvelle.

## Limite sans configuration serveur

Un site statique ne peut pas envoyer seul de vraies notifications push en arriere-plan.

La surveillance locale fonctionne seulement quand l'application ou le site est ouvert, ou parfois quand la PWA reste active selon le navigateur. Pour recevoir une notification meme quand l'application est fermee, il faut un backend push.

Il manque encore un service serveur pour :

1. enregistrer les abonnements push des utilisateurs ;
2. stocker les preferences associees ;
3. detecter les nouvelles actualites ou nouveaux matchs ;
4. envoyer les notifications aux bons utilisateurs.

Le code actuel ne casse rien si ce backend n'existe pas. Il prepare simplement le terrain.

## Option 1 : Cloudflare Pages Functions + Web Push

Architecture recommandee si le site reste chez Cloudflare. Elle est maintenant preparee dans ce projet :

1. Creer des cles VAPID Web Push.
2. Ajouter la cle publique cote site, par exemple :

```html
<meta name="web-push-public-key" content="CLE_PUBLIQUE_VAPID" />
```

ou definir :

```js
window.RCC_PUSH_PUBLIC_KEY = 'CLE_PUBLIQUE_VAPID';
```

3. Utiliser la Pages Function `/api/push/subscribe`.
4. Quand l'utilisateur clique sur `Activer les notifications`, envoyer son abonnement et ses preferences a la Pages Function.
5. Stocker les abonnements dans Cloudflare KV, D1 ou R2.
6. Utiliser la Pages Function `/api/push/send`.
7. A chaque modification de `data/news.json` ou `data/matches.json`, declencher l'envoi via GitHub Actions ou un webhook.
8. La Pages Function filtre les abonnements selon `audience` et envoie uniquement aux personnes concernees.

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
- `Cadettes`
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

## Migration vers le domaine officiel

Les abonnements Web Push sont lies a l'origine qui les a crees. Ils ne peuvent donc pas etre transferes automatiquement vers un autre domaine.

- Les nouveaux abonnements sont acceptes uniquement depuis `https://rccubzaguais.fr` (et depuis localhost pour les tests locaux).
- Le KV enregistre maintenant `siteOrigin` avec chaque abonnement.
- Lors d'un envoi, les abonnements sans origine officielle sont ignores puis supprimes du KV sans recevoir de notification.
- Si une ancienne origine charge encore `notifications.js`, son abonnement local est resilie sans nouvelle demande d'autorisation et un message invite a reactiver les alertes sur le domaine officiel.
- Les preferences de categories restent conservees sur le domaine ou elles ont ete creees ; aucune autorisation n'est redemandee automatiquement.

Procedure utilisateur : ouvrir `https://rccubzaguais.fr/notifications.html`, choisir les categories puis cliquer sur `Activer les notifications`. Une ancienne PWA installee depuis une autre origine peut etre desinstallee apres cette reactivation.

La redirection permanente de l'ancien sous-domaine Cloudflare doit etre configuree dans le tableau de bord Cloudflare apres une courte periode de migration. Une redirection seule ne migre pas un abonnement Web Push.
