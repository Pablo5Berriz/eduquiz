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
 * - `webpack.resolve.extensionAlias` : indispensable pour résoudre les
 *   imports NodeNext (`.js` qui pointent en réalité vers `.ts`) dans
 *   les workspaces partagés (notamment `@eduquiz/db`). Sans cela
 *   Webpack 5 échoue avec "Module not found: Can't resolve './x.js'".
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

  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },

  // i18n App Router : routes préfixées `/[locale]/...`, détection dans
  // `middleware.ts`, persistance via cookie `NEXT_LOCALE`. Pas de bloc
  // `i18n` natif Next car il est incompatible avec App Router.
};

export default nextConfig;
