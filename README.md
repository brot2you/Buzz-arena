# BUZZ ARENA by BROT2YOU

Buzzer en direct pour classes, avec QR code, classement, sons et interface en six langues. L'application est hébergée sur GitHub Pages ; les parties utilisent Firebase Realtime Database.

## Deux modes Firebase

### 1. Mon espace BROT2YOU — infrastructure personnelle de l'éditeur

Le projet Firebase utilisé est `buzz-arena-brot2you`. Il **doit être verrouillé côté Firebase** pour que d'autres enseignants ne puissent pas créer de parties avec les quotas de son propriétaire.

1. Ouvrir BUZZ ARENA > **Je suis professeur** > **Afficher mon identifiant Firebase (UID)** et se connecter au compte Google propriétaire ; copier l'UID affiché. On peut aussi lire cet UID dans Firebase Console > Authentication > Utilisateurs.
2. Ouvrir [database.rules-private-owner.json](database.rules-private-owner.json) et **remplacer exactement** `REPLACE_WITH_YOUR_FIREBASE_GOOGLE_UID` par l'UID propriétaire, sans retirer les apostrophes.
3. Dans le projet Firebase **buzz-arena-brot2you**, ouvrir Realtime Database > Règles ; copier l'intégralité des règles privées personnalisées et **Publier**.
4. Tester : le compte propriétaire peut créer une partie, un autre compte Google ne le peut pas, et un élève peut toujours rejoindre avec un QR code.

**Attention :** tant que les règles propriétaires ne sont pas publiées sur le vrai projet Firebase, les enseignants extérieurs peuvent encore utiliser les quotas du projet BROT2YOU. Les contrôles d'interface ne protègent pas une base Firebase ; seules les règles côté serveur le font. Ne jamais publier les règles privées avec leur UID fictif : cela bloquerait aussi le propriétaire.

### 2. Mon propre Firebase — enseignants extérieurs

L'enseignant crée un projet Firebase **distinct** dans Firebase Console :

1. Realtime Database, dans la région de son choix.
2. Authentication > Méthode de connexion : activer **Google** (professeur) et **Anonyme** (élèves).
3. Authentication > Paramètres > Domaines autorisés : ajouter `brot2you.github.io`.
4. Realtime Database > Règles : copier [database.rules.json](database.rules.json), puis publier dans **son propre projet**, pas celui de BROT2YOU.
5. Paramètres du projet > Général > Vos applications > Web ; récupérer le bloc `const firebaseConfig = { ... };` contenant `apiKey`, `authDomain`, `databaseURL`, `projectId` et `appId`.
6. Dans BUZZ ARENA > **Je suis professeur**, sélectionner **Mon propre Firebase**, coller le bloc et cliquer sur **Enregistrer et utiliser mon Firebase**, puis créer une partie.

La configuration Web est conservée **localement dans le navigateur** de l'enseignant. Elle n'est pas stockée sur le Firebase BROT2YOU. Le QR code et le lien élève transmettent les **identifiants publics de configuration** de son projet, pour que les appareils élèves s'y connectent automatiquement. Aucune clé de service, clé privée ou mot de passe ne doit être collé dans ce champ.

**Important :** pour rejoindre une partie sur un Firebase personnel, les élèves doivent scanner le **QR code** ou ouvrir le **lien élève** fourni par l'enseignant ; le seul code à six caractères ne permet pas de retrouver automatiquement le bon projet Firebase sur un appareil qui ne le connaît pas. Le lien de projection transporte également cette configuration.

**Isolation et limites :** chaque enseignant utilisant un projet personnel supporte ses propres quotas et sa facturation éventuelle. Le code du site reste public, mais l'utilisation du Firebase BROT2YOU ne doit être accessible qu'à son propriétaire après application des règles propriétaires. Les élèves peuvent lire la session à laquelle ils ont accès avec un code de partie valide. Éviter les noms complets et données personnelles.

## Déploiement

Site : https://brot2you.github.io/Buzz-arena/

Sources : `index.html`, `app.js`, `i18n.js`, `firebase-config.js`, `style.css`. Les fichiers MP3 sont dans `sounds/` et les logos dans `assets/`.
