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

export { Input } from './components/Input';
export type { InputProps, InputVariants } from './components/Input';

export { PasswordInput } from './components/PasswordInput';
export type { PasswordInputProps } from './components/PasswordInput';

export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export { FormField } from './components/FormField';
export type { FormFieldProps } from './components/FormField';

export { Alert } from './components/Alert';
export type { AlertProps, AlertVariants } from './components/Alert';

export { Avatar } from './components/Avatar';
export type { AvatarProps, AvatarVariants } from './components/Avatar';

export { cn } from './utils/cn';
