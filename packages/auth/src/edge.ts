/**
 * Point d'entrée Edge-safe du paquet @eduquiz/auth.
 *
 * À importer depuis :
 *   - `apps/web/src/middleware.ts` (Edge runtime)
 *
 * Ne jamais importer Prisma, Argon2 ou tout binding natif depuis ce
 * module — il doit rester compatible avec le runtime Edge de Next.js.
 *
 * Pour les opérations runtime Node (signin Credentials, OAuth, lecture
 * DB de la session), utiliser `@eduquiz/auth` (config.ts).
 */

import './session.js';

export { authConfigEdge } from './config-edge.js';
export type { AuthSessionUser, AuthSessionUserExtras } from './session.js';
