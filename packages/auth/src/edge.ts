/**
 * Point d'entrée Edge-safe du paquet @eduquiz/auth.
 */

import './session';

export { authConfigEdge } from './config-edge';
export type { AuthSessionUser, AuthSessionUserExtras } from './session';
