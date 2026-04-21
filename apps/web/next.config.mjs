/**
 * Configuration Next.js d'@eduquiz/web.
 *
 * - `transpilePackages` : indispensable dans un monorepo pnpm pour que
 *   Next puisse transpiler les paquets workspace qui exportent du
 *   TypeScript non compilé (on ne publie pas de `dist/` côté app).
 * - `reactStrictMode` : activé en permanence pour détecter tôt les
 *   effets non idempotents.
 * - `poweredByHeader` : masqué pour ne pas divulguer la stack.
 * - `experimental.instrumentationHook` : activé pour préparer Sentry et
 *   OpenTelemetry (configurés à une étape ultérieure).
 * - `output: 'standalone'` : produit un bundle autonome prêt à être
 *   empaqueté dans une image Docker minimale pour le déploiement
 *   Proxmox (étape 0.5).
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',

  transpilePackages: ['@eduquiz/db', '@eduquiz/i18n', '@eduquiz/ui', '@eduquiz/utils'],

  experimental: {
    instrumentationHook: true,
  },

  // i18n natif Next.js App Router : les locales sont gérées côté code
  // via `@eduquiz/i18n` + cookie `NEXT_LOCALE`. La détection navigateur
  // se fait dans `middleware.ts` à l'étape suivante.
};

export default nextConfig;
