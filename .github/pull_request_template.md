<!--
Merci pour ta contribution à EduQuiz.

Remplir TOUTES les sections. Les PR sans contexte ou sans plan de test
seront fermées et renvoyées à l'auteur.

Titre : Conventional Commits (ex. `feat(web): add parent dashboard`).
-->

## Résumé

<!-- Qu'est-ce qui change, en 2-3 phrases. Pas de "refactoring" nu : dire
ce qui est refactorisé et pourquoi. -->

## Pourquoi

<!-- Contexte : ticket lié, incident, demande utilisateur, objectif produit.
Pas de "parce qu'il le faut". -->

## Changements principaux

<!-- Liste courte (3-7 points max) des changements visibles dans le diff. -->

## Plan de test

<!-- Comment as-tu validé ? Lister les commandes exécutées localement et,
si pertinent, les scénarios manuels couverts. Un "j'ai vérifié" nu ne
compte pas. -->

- [ ] `pnpm lint` passe
- [ ] `pnpm typecheck` passe
- [ ] `pnpm test` passe (ou N/A si rien à tester)
- [ ] Testé manuellement sur :
      <!-- `http://localhost:3000/...` ou simulateur iOS/Android -->

## Checklist

- [ ] Titre en Conventional Commits avec scope valide
- [ ] Documentation mise à jour (README, docs/, commentaires de code)
- [ ] Nouvelles variables d'environnement ajoutées à `.env.example` et/ou
      `.env.prod.example`
- [ ] Migrations Prisma **rétrocompatibles** (phase 1 : ajout nullable, phase 2
      : backfill, phase 3 : contrainte) si schéma touché
- [ ] Pas de secret, clé ni token commité
- [ ] Impact Loi 25 considéré (cf. `docs/04-security-loi25.md`) pour toute
      manipulation de données personnelles

## Breaking change ?

<!-- Oui / Non. Si oui : décrire la migration utilisateur et/ou opérateur. -->

## Captures d'écran / logs (optionnel)

<!-- Si UI modifiée, joindre avant/après. Si nouvel endpoint, joindre la
réponse curl. -->
