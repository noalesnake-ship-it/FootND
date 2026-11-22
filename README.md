# Kick Brawl 3D

Jeu de foot 3D 3v3 pour iPhone (navigateur). Solo contre des bots, ou en ligne avec des amis.

## 1. Mettre le jeu en ligne sur GitHub Pages
1. Crée un dépôt GitHub (public) et envoie-y **tous les fichiers de ce dossier** (à la racine).
2. Dépôt → **Settings → Pages** → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save.
3. Après ~1 minute, le jeu est sur `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.
4. Sur iPhone : ouvre l'adresse dans Safari → bouton Partager → **Sur l'écran d'accueil** (plein écran, paysage).

Le solo, le ralenti de but et les filets animés fonctionnent déjà à ce stade, sans rien configurer.

## 2. Activer le multijoueur (Firebase, gratuit)
1. https://console.firebase.google.com → **Ajouter un projet**.
2. **Authentication → Sign-in method → E-mail/Mot de passe → Activer** (laisse « Lien par e-mail » désactivé). Les joueurs n'ont besoin que d'un pseudo et d'un mot de passe : le jeu fabrique un e-mail fictif en interne.
3. **Authentication → Settings → Domaines autorisés** → ajoute `TON-PSEUDO.github.io`.
4. **Realtime Database → Créer une base** (région `europe-west1`, mode verrouillé), puis onglet **Règles** → colle le contenu de `database.rules.json` → Publier.
5. **Paramètres du projet → Vos applications → Web (</>)** → copie l'objet `firebaseConfig`, y compris `databaseURL`.
6. Colle-le dans `firebase-config.js` à la place de `null`, puis recommit.

## 3. Compte, amis et salons
- Onglet **Amis** → **Inscription** : choisis un pseudo (3 à 14 caractères) et un mot de passe (6 minimum). Sur un autre appareil, **Connexion** avec les mêmes identifiants : tes chaussures, pièces et coffres sont les mêmes partout (sauvegarde dans le cloud).
- Pour ajouter un ami : tape son **pseudo** (ou son code ami à 6 caractères) dans « Ajouter un ami ».
- **Créer un salon** → un code de salon (5 caractères) apparaît ; invite un ami en ligne ou donne-lui le code.
- Dans le salon : choisis ton équipe (bleue/rouge, 3 places chacune). Les places vides sont jouées par des bots. L'hôte (👑) lance le match.
- Si un ami est dans un salon, tu as un bouton **Rejoindre** dans ta liste d'amis.

## Mode test sans Firebase
Tant que `firebase-config.js` vaut `null`, l'onglet Amis passe en **mode test local** : ouvre le jeu dans deux onglets du même navigateur et ils se voient entre eux (amis, salon, match). Pratique pour essayer.

## Comment ça marche (et ses limites)
- L'**hôte** du salon fait tourner la simulation ; les autres envoient leurs commandes (~20/s), l'hôte diffuse l'état (~15/s) via Firebase. Chaque client interpole et prédit son propre joueur.
- Latence typique : 100 à 250 ms (le relais passe par Firebase, pas du pair-à-pair). Bien pour du jeu entre amis, pas pour du compétitif.
- Si l'hôte quitte, le salon est fermé. Si un joueur quitte en match, un bot le remplace.
- Ajouter un ami est réciproque et immédiat (pas de demande à accepter). Pas d'anti-triche : l'inventaire de chaussures est stocké sur chaque appareil.
- Mot de passe oublié : il n'y a pas d'e-mail réel, donc pas de réinitialisation automatique. Tu peux supprimer ou réinitialiser le compte dans Firebase → Authentication → Users.
- Première connexion à un compte depuis un appareil qui a déjà une progression locale : les deux sont fusionnées (toutes les chaussures sont gardées, niveau le plus haut). Ensuite, le cloud fait foi.
- Le plan gratuit Firebase (Spark) suffit largement pour quelques dizaines d'amis.
