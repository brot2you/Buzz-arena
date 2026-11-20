# BUZZ ARENA — Connexion Firebase

L'application utilise le projet Firebase **quiz-arena-brot2you** avec des données séparées sous `buzzArena/sessions`.

## Mise en service

1. Firebase Console > projet quiz-arena-brot2you > Authentication : vérifier que **Google** et **Anonyme** sont activés et que **brot2you.github.io** figure dans les domaines autorisés.
2. Realtime Database > Règles : faire une copie des règles **actuellement publiées**. Comparer à `firebase-rules-QUIZ-ET-BUZZ.json`, puis fusionner la section `buzzArena` dans les règles actives. **Ne pas remplacer les règles QUIZ ARENA** par `database.rules.json`.
3. Publier les règles Firebase fusionnées. Le déploiement GitHub Pages ne publie pas ces règles.
4. Depuis https://brot2you.github.io/Buzz-arena/ : créer une partie avec un compte Google puis rejoindre depuis un autre navigateur/téléphone.

Les connexions en temps réel ne peuvent pas fonctionner avant la publication des règles Firebase. Les sessions n'ont pas de suppression automatique ; éviter les noms complets des élèves. Tout compte Google peut créer une session dont il devient le seul propriétaire.
