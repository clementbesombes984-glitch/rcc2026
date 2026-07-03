# Notifications RCC

La PWA contient maintenant une base complete pour les notifications :

- page `notifications.html` ;
- preferences locales par categorie ;
- autorisation demandee uniquement apres clic ;
- service worker pret pour `push` et `notificationclick`.

L'envoi reel necessite encore Firebase Cloud Messaging ou un Cloudflare Worker + Web Push.

Voir le guide complet : `NOTIFICATIONS.md`.
