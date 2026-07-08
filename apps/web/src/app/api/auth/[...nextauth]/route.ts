/**
 * Catch-all route handler Auth.js v5.
 *
 * Toutes les requêtes `/api/auth/*` sont traitées ici :
 *   - `GET  /api/auth/session`          → JSON de la session courante
 *   - `GET  /api/auth/csrf`             → token CSRF pour les forms POST
 *   - `GET  /api/auth/providers`        → liste des providers configurés
 *   - `GET  /api/auth/signin/<provider>` → redirige vers le provider OAuth
 *   - `GET  /api/auth/callback/<provider>` → consomme le callback OAuth
 *   - `POST /api/auth/signout`          → invalide la session
 *   - `POST /api/auth/callback/credentials` → submit du formulaire login
 *
 * Cette route force le runtime Node (par défaut sur les routes API).
 * Auth.js a besoin de Prisma et `argon2`, qui ne tournent pas sur Edge.
 */

// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '../../../../auth';

export const { GET, POST } = handlers;

export const runtime = 'nodejs';
