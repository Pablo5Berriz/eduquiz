# @eduquiz/types

Types TypeScript partagés entre web, mobile et API.

## Contenu à venir

- Types de domaine métier (`User`, `ParentChildLink`, `Lesson`, `Quiz`,
  `Attempt`, ...) — dérivés autant que possible du client Prisma.
- DTOs de Server Actions et Route Handlers.
- Enums partagés (`UserRole`, `LinkStatus`, `ExerciseType`, `ContentLocale`).
- Schémas Zod partagés et types inférés.

## Règle

Ce paquet ne contient **que** des types et des constantes pures. Aucun import
runtime (pas de React, pas de Prisma client), pour permettre une consommation
légère côté mobile.

## État actuel

Paquet scaffoldé (étape 0.1). Les types arrivent à partir du Lot 2.
