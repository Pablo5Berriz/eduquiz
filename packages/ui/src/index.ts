/**
 * Point d'entrée du paquet @eduquiz/ui.
 *
 * Expose les composants de design system partagés entre web (Next.js
 * App Router + Tailwind) et mobile (Expo + NativeWind, à venir). Les
 * variants sont typés via `tailwind-variants` pour garantir une API
 * uniforme.
 */
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariants } from './components/Button';

export { Container } from './components/Container';
export type { ContainerProps, ContainerVariants } from './components/Container';

export { Logo } from './components/Logo';
export type { LogoProps } from './components/Logo';

export { Card } from './components/Card';
export type { CardProps, CardVariants } from './components/Card';

export { SectionHeading } from './components/SectionHeading';
export type { SectionHeadingProps } from './components/SectionHeading';

export { cn } from './utils/cn';
