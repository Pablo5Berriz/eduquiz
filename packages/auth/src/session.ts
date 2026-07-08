// packages/auth/src/session.ts

import { Locale, UserRole } from './constants.js';

export interface AuthSessionUserExtras {
  role: UserRole;
  locale: Locale;
  emailVerifiedAt: Date | null;
  disabledAt: Date | null;
  deletedAt: Date | null;
  sessionVersion: number;
}

export interface AuthSessionUser extends AuthSessionUserExtras {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly image: string | null;
}

declare module 'next-auth' {
  interface Session {
    user: AuthSessionUser;
  }
  interface User extends Partial<AuthSessionUserExtras> {
    id?: string;
  }
  interface JWT extends Partial<AuthSessionUserExtras> {
    sub?: string;
  }
}
