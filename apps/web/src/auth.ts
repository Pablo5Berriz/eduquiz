/**
 * Instanciation Auth.js v5 pour l'application web.
 *
 * Ce fichier consomme `authConfig` de `@eduquiz/auth` (runtime Node.js
 * uniquement) et expose les helpers attendus par Next.js et les routes.
 *
 *   - `auth()`          : récupère la session côté Server Component / RSC
 *   - `signIn()`        : déclenche un flux d'authentification
 *   - `signOut()`       : invalide la session courante
 *   - `handlers`        : `{ GET, POST }` à brancher dans la route
 *                         `/api/auth/[...nextauth]/route.ts`
 *
 * **NE PAS** importer ce fichier depuis le middleware — il importe
 * l'adapter Prisma et `argon2`, incompatibles avec Edge runtime.
 * Pour le middleware, utiliser `apps/web/src/middleware.ts` qui consomme
 * `@eduquiz/auth/edge`.
 */

import { authConfig } from '@eduquiz/auth';
import NextAuth from 'next-auth';

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
