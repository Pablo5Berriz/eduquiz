// @ts-check

/**
 * Tokens de design partagés entre web (apps/web via Tailwind) et mobile
 * (apps/mobile via NativeWind). Sert de socle commun importé puis enrichi
 * par chaque app avec sa propre `content`, ses presets spécifiques et ses
 * plugins.
 *
 * Usage côté web :
 *   import baseConfig from '@eduquiz/config/tailwind';
 *   export default { ...baseConfig, content: ['./src/** /*.{ts,tsx}'] };
 *
 * Choix d'accessibilité :
 *   - Palette neutre avec contrastes >= 4.5:1 sur fond clair et sombre.
 *   - Tailles de police accessibles, scale typographique fluide.
 *   - Tokens de focus visibles (ring) compatibles WCAG 2.1 AA.
 *
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palette de marque EduQuiz (provisoire — à valider design)
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Couleurs sémantiques pour feedback pédagogique
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif Pro"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        // Police optionnelle pour l'accessibilité (paramètre utilisateur)
        dyslexic: ['"OpenDyslexic"', 'sans-serif'],
      },
      fontSize: {
        // Scale fluide accessible
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        // Tokens additionnels pour zones tactiles min 44x44 (WCAG)
        'touch-min': '2.75rem',
      },
      borderRadius: {
        // Arrondis cohérents avec shadcn/ui
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      ringWidth: {
        // Anneau de focus accessible
        DEFAULT: '2px',
        focus: '3px',
      },
    },
  },
  plugins: [],
};

export default config;
