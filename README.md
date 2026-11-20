# BUZZ ARENA · by BROT2YOU

Application de buzzers pour la classe. Trois vues : professeur, élève, projection. Design pastel/pop inspiré de Class Reward Jar. Hébergement statique GitHub Pages ; synchronisation temps réel Firebase.

## Installation (nécessaire avant le vrai multijoueur)

1. Créer un projet dans la console Firebase et enregistrer une **application Web**.
2. Dans **Authentication > Sign-in method**, activer **Google** et **Anonyme** ; dans les domaines autorisés, inclure `brot2you.github.io` si besoin.
3. Dans **Realtime Database**, créer une base (choisir sa région, par ex. `europe-west1`) ; copier la bonne URL de base.
4. Dans `firebase-config.js`, renseigner les valeurs de la configuration Web et `databaseURL`.
5. Se connecter une première fois avec son compte Google (depuis l'écran professeur), relever son UID dans **Authentication > Users**, puis l'inscrire comme `TEACHER_UID` dans `firebase-config.js`.
6. Dans `database.rules.json`, **remplacer toutes** les occurrences de `REMPLACER_UID_PROFESSEUR` par **le même UID**. Copier ensuite le contenu de ce fichier dans l'onglet **Règles** de Realtime Database et publier. Ne pas laisser des règles ouvertes publiquement.
7. Publier le contenu de ce dossier à la racine du dépôt GitHub `Buzz-Arena`, puis activer GitHub Pages (branche main, dossier racine).
8. Ouvrir `https://brot2you.github.io/Buzz-Arena/`. Connecter le compte professeur Google, créer une partie, rejoindre avec un autre appareil et le code.

**Important :** GitHub Pages ne fournit pas de serveur de synchronisation. Firebase est indispensable pour le mode multijoueur. Tant que la configuration contient `REMPLACER`, l'interface est consultable mais les sessions ne sont pas actives.

## Fonctionnalités V1

- Entrée des élèves sur smartphone/tablette/PC avec code à 6 caractères et pseudo.
- Compte professeur Google limité à un UID prédéfini ; élèves anonymes Firebase.
- Parties individuelles ou par équipes, points manuels et export CSV.
- Buzz unique par manche via transaction Firebase Realtime Database. Le serveur arbitre une première écriture, mais les latences réseau ne sont pas égales.
- Fermeture, ouverture, nouvelle manche ; tableau professeur et vue de projection distincte.
- Interface adaptée aux écrans tactiles ; animation du buzzer et son bref (si autorisé par le navigateur).
- Mise à jour de présence périodique ; un élève inactif depuis plus d'une minute n'est pas compté comme connecté.

## Limites / précautions

- Les sessions sont conservées en base, sans suppression automatique. Prévoir une politique de purge pour les classes.
- Les pseudos sont visibles par les autres élèves d'une même session : privilégier les prénoms ou pseudonymes non identifiants.
- Toute personne ayant le code peut rejoindre une partie en tant qu'élève ; ne pas afficher le code en dehors de la classe.
- Les scores sont protégés par l'UID professeur, mais il s'agit d'une V1. Pour un déploiement à large échelle, ajouter App Check, quotas, limitation des sessions, purge et règles renforcées.
- Les sessions perdues après fermeture de la régie peuvent rester dans la base ; garder l'onglet enseignant ouvert pendant le jeu.
