# KickBrawl 3D

Jeu de foot 3D pour iPhone (coffres, chaussures, monnaie, raretés, multijoueur entre amis).
Site statique hébergé sur **GitHub Pages**, comptes / amis / salons / sauvegarde sur **Supabase**.

## 1. Mettre le site en ligne (GitHub Pages)
1. Sur GitHub, crée un dépôt, puis envoie-y **tous** les fichiers de ce dossier (Add file → Upload files).
2. Settings → Pages → Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Ouvre l'adresse `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/` et ajoute-la à l'écran d'accueil de l'iPhone.

## 2. Base de données (Supabase) — une seule fois
1. Projet Supabase → **Authentication → Sign In / Providers → Email** : désactive **Confirm email**, puis Save.
2. **SQL Editor → New query** : colle tout le contenu de `supabase.sql`, puis **Run**.
3. Dans `supabase-config.js`, `url` et `key` doivent contenir l'URL du projet et la clé **publishable** (`sb_publishable_…`).
   Ces deux valeurs sont publiques. Ne mets jamais une clé `secret` / `service_role`.

## Comptes, amis, salons
- Inscription avec un **pseudo + mot de passe** (6 caractères minimum). La progression (coins, chaussures…) est sauvegardée dans le compte et se retrouve sur tous tes appareils.
- Ajoute un ami par son **pseudo** ou son **code ami** (réciproque immédiatement).
- Crée un salon, partage le code (ou invite un ami en ligne), choisis ton équipe (3 max par équipe), l'hôte lance le match.

## Limites connues
- L'hôte fait tourner la partie : latence de 100 à 250 ms, et si l'hôte quitte, le salon se ferme.
- Pas de récupération de mot de passe (e-mails fictifs) : on réinitialise depuis Supabase → Authentication → Users.
- Pas d'anti-triche, pas de matchmaking aléatoire.
- Offre gratuite Supabase : quotas de messages temps réel (≈ 100 messages/s au total). Quelques salons en parallèle passent, pas des dizaines.

## Mode test local
Mets `window.KB_SUPABASE = null;` dans `supabase-config.js` : les comptes et salons ne sont alors partagés qu'entre onglets du même navigateur.
