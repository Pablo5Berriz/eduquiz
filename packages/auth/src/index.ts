/**
 * Point d'entrée Node.js du paquet @eduquiz/auth.
 *
 * À importer depuis :
 *   - `apps/web/src/auth.ts` qui instancie `NextAuth(authConfig)`
 *   - Les Server Components et Route Handlers via les helpers de
 *     `@eduquiz/auth/permissions`, `@eduquiz/auth/password`,
 *     `@eduquiz/auth/tokens`
 *
 * **NE PAS** importer ce module depuis le middleware Next.js (Edge
 * runtime). Utiliser `@eduquiz/auth/edge` à la place.
 */

// Augmentation des types `next-auth` (effet de bord d'import).
import './session.js';

export { authConfig } from './config.js';
export { adapter } from './adapter.js';
export { getAuthEnv, isProviderConfigured, type AuthEnv } from './env.js';

export type { AuthSessionUser, AuthSessionUserExtras } from './session.js';
