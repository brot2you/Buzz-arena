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

## Sons de buzzer personnalisés (5 sons)

Les élèves choisissent et testent leur son avant d'entrer, et peuvent le modifier pendant la partie. À l'arrivée du premier buzz, la régie et l'écran de projection jouent le son choisi si le professeur a cliqué « Activer le son ». Un navigateur peut limiter la lecture automatique tant qu'aucun bouton sonore n'a été cliqué.

**Installation des sons :** déposer les 5 fichiers MP3 dans le répertoire `sounds/` (inclus dans l'archive `BUZZ-ARENA-Sons.zip` fournie dans le chat). Le dossier doit contenir :

- `sounds/the-voice.mp3`
- `sounds/loud-correct-buzzer.mp3`
- `sounds/tv-total-buzzer.mp3`
- `sounds/question-pour-un-champion.mp3`
- `sounds/funny-correct-buzzer.mp3`

**Important :** republier `database.rules.json` dans la Realtime Database Firebase du projet `buzz-arena-brot2you`, car le champ `players/$uid/sound` est nouveau. Sans cette mise à jour, l'inscription d'un élève peut être rejetée. Les fichiers audio ne sont pas encore présents dans le dépôt tant qu'ils n'ont pas été envoyés manuellement.
