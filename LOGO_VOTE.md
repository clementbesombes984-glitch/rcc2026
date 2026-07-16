# Vote nouveau logo RCC

Cette fonctionnalite ajoute une page cachee de vote pour le futur logo du Racing Club Cubzaguais.

## Fichiers principaux

- `vote-logo.html` : page publique de vote.
- `vote-logo.js` : chargement des propositions et envoi du vote.
- `data/logo-vote.json` : configuration du vote et propositions modifiables depuis Pages CMS.
- `admin/logo-vote-results.html` : resultats reserves a l'administration.
- `functions/api/logo-vote.js` : endpoint public de vote.
- `functions/api/logo-vote/results.js` : endpoint admin des resultats.

## Activation

Dans Pages CMS, ouvrir la rubrique `Vote nouveau logo`, puis regler :

- `voteEnabled` : active ou ferme le vote.
- `showInMenu` : affiche le lien dans le menu `Le Club` uniquement quand le vote est ouvert.
- `startDate` et `endDate` : dates facultatives.
- `showPublicResults` : reserve pour une publication future des resultats, les resultats restent caches par defaut.

Par defaut, le vote est ferme.

## Stockage serveur

Les votes ne sont pas stockes dans un fichier JSON public. Ils utilisent un KV Cloudflare Pages.

Binding requis dans Cloudflare Pages :

```text
RCC_LOGO_VOTES
```

Variable recommandee pour renforcer le hash des e-mails :

```text
RCC_LOGO_VOTE_SALT
```

Sans `RCC_LOGO_VOTES`, la page publique reste visible si le vote est active, mais l'enregistrement serveur des votes renverra une erreur de configuration.

## Confidentialite

L'adresse e-mail n'est pas affichee et n'est pas stockee en clair dans le KV. Le serveur conserve uniquement un hash utilise pour limiter les doubles votes.

## Resultats

Page reservee :

```text
/admin/logo-vote-results.html
```

Elle permet :

- consulter le total des votes ;
- voir les votes par proposition ;
- exporter un CSV ;
- remettre les compteurs a zero apres confirmation explicite.
