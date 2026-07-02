INSTALLATION DECAP CMS + GITHUB SUR CLOUDFLARE PAGES

1) Copie le dossier "functions" à la racine de ton projet.
   Tu dois obtenir :
   functions/api/auth/index.js
   functions/api/auth/callback.js

2) Dans ton fichier admin/config.yml, remplace le début par :

backend:
  name: github
  repo: clementbesombes984-glitch/rcc2026
  branch: main
  base_url: https://rcc2026.pages.dev
  auth_endpoint: /api/auth

site_url: https://rcc2026.pages.dev
display_url: https://rcc2026.pages.dev

media_folder: assets/uploads
public_folder: /assets/uploads

Garde tes collections existantes en dessous.

3) Sur GitHub :
   Settings > Developer settings > OAuth Apps > New OAuth App

   Application name:
   RCC2026 CMS

   Homepage URL:
   https://rcc2026.pages.dev

   Authorization callback URL:
   https://rcc2026.pages.dev/api/auth/callback

4) Sur Cloudflare Pages :
   Projet rcc2026 > Settings > Variables and secrets

   Ajoute :
   GITHUB_CLIENT_ID = Client ID GitHub
   GITHUB_CLIENT_SECRET = Client Secret GitHub

5) Push :
   git add .
   git commit -m "Configuration Decap GitHub Cloudflare"
   git push

6) Après le déploiement :
   Va sur https://rcc2026.pages.dev/admin/
   Le bouton devrait ouvrir une connexion GitHub.
