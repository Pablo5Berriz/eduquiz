/**
 * Adapter Prisma pour Auth.js v5.
 *
 * On enveloppe le `PrismaAdapter` officiel pour deux raisons :
 *
 *  1. **Génération d'ID UUID v7 côté Postgres**. Le schéma Prisma déclare
 *     `@default(uuid(7))` sur `User`, `Account`, `Session`. L'adapter
 *     officiel n'envoie pas le champ `id` à la création, donc Prisma
 *     applique le défaut → comportement souhaité, rien à modifier.
 *
 *  2. **Capture des métadonnées de session** (IP, user-agent). Auth.js ne
 *     les passe pas à l'adapter par défaut. On laisse les champs nuls
 *     ici et on enrichit la `Session` après création depuis le callback
 *     `events.signIn` (cf. `config.ts`) qui a accès à la `Request`.
 *
 *  3. **Compatibilité émail Citext**. La colonne `users.email` est
 *     `@db.Citext` côté Postgres : les comparaisons sont case-insensitive
 *     nativement. L'adapter officiel `PrismaAdapter` fonctionne tel quel
 *     dessus — aucune adaptation nécessaire.
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@eduquiz/db';

import type { Adapter } from 'next-auth/adapters';

/**
 * Instance unique d'adapter prête à être passée à `NextAuth({ adapter })`.
 *
 * Le client Prisma utilisé est le singleton « service-role » de
 * `@eduquiz/db` — l'adapter Auth.js a besoin d'opérer hors RLS car il
 * crée des sessions pour des utilisateurs qui ne sont, par définition,
 * pas encore identifiés au moment de l'opération.
 */
export const adapter: Adapter = PrismaAdapter(prisma);
