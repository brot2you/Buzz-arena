# BUZZ ARENA by BROT2YOU

Application de buzzers multijoueur sur GitHub Pages, avec un projet Firebase dédié.

## Projet Firebase

- ID : `buzz-arena-brot2you`
- Realtime Database : `https://buzz-arena-brot2you-default-rtdb.europe-west1.firebasedatabase.app`
- Configuration Web : `firebase-config.js`
- Règles à publier manuellement : `database.rules.json`

## Mise en service (obligatoire)

1. Dans Firebase Console, projet **buzz-arena-brot2you**, ouvrir **Realtime Database > Règles**.
2. Remplacer les règles par le contenu entier du fichier **database.rules.json** de ce dépôt et cliquer sur **Publier**. Ne pas publier les règles du projet Quiz Arena.
3. Dans **Authentication > Méthode de connexion**, activer **Google** (professeur) et **Anonyme** (élèves).
4. Dans **Authentication > Paramètres > Domaines autorisés**, ajouter **brot2you.github.io** si nécessaire.
5. Sur `https://brot2you.github.io/Buzz-arena/`, créer une partie avec Google sur le poste enseignant et rejoindre depuis un autre appareil anonyme.

### Notes

L'application ne peut pas accéder aux données tant que les règles Firebase ne sont pas publiées. Le site est indépendant de Quiz Arena. Un compte Google connecté peut créer sa propre session ; seules ses sessions peuvent ensuite être gérées par ce compte. Éviter de saisir les noms complets des élèves.
