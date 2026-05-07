/**
 * Point d'entrée du paquet @eduquiz/db.
 *
 * Expose :
 *   • `prisma`          — singleton PrismaClient standard, sans contexte RLS.
 *   • `prismaService`   — client privilégié pour Auth.js/tâches internes ;
 *                         peut contourner RLS selon `SERVICE_DATABASE_URL`.
 *   • `withUser`        — helper RLS : ouvre une transaction et positionne
 *                         les variables de session `app.current_user_id`
 *                         et `app.current_role` lues par les politiques.
 *   • `PrismaClient`    — classe (ré-export) pour tests ou cas avancés.
 *   • `Prisma`          — namespace de types Prisma (inputs, where, etc.).
 *   • Les enums applicatifs — voir `./enums`.
 */

export { prisma, prismaService, withUser, PrismaClient } from './client.js';
export type { Prisma, RlsContext, RlsRole } from './client.js';
export * from './enums.js';
