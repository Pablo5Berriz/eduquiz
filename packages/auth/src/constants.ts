// packages/auth/src/constants.ts
export const UserRole = {
  LEARNER_ADULT: 'LEARNER_ADULT',
  LEARNER_MINOR: 'LEARNER_MINOR', // ← était LEARNER_CHILD, corrigez ici
  PARENT: 'PARENT',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Locale = {
  FR: 'FR',
  EN: 'EN',
} as const;
export type Locale = (typeof Locale)[keyof typeof Locale];
