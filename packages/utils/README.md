# @eduquiz/utils

Utilitaires purs, sans état, sans effet de bord, sans dépendance
runtime lourde.

## Règles strictes

- Pas d'import de React, Next.js, Prisma, Expo, Tailwind, ni de toute
  lib spécifique à un runtime.
- Toute fonction exportée est typée de façon stricte et documentée avec
  JSDoc.
- Test unitaire systématique (Vitest) colocalisé `foo.ts` ↔ `foo.test.ts`.

## Contenu à venir

- Helpers de date et durée (formatage bilingue, calculs de série).
- Normalisation de chaînes (slugs, comparaisons tolérantes pour les
  exercices « réponse courte »).
- Helpers de progression (ratios de maîtrise par compétence).
- Validateurs réutilisables (codes 6 chiffres, courriels, mots de passe
  avec règles de robustesse).

## État actuel

Paquet scaffoldé (étape 0.1).
