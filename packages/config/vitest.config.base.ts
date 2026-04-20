import { defineConfig, type ViteUserConfig } from 'vitest/config';

/**
 * Configuration Vitest partagée. Les paquets la réutilisent via :
 *
 *   import { defineConfig, mergeConfig } from 'vitest/config';
 *   import base from '@eduquiz/config/vitest';
 *   export default mergeConfig(base, defineConfig({ ...overrides }));
 *
 * Cible de couverture : 70 % sur la logique métier (exigence du brief).
 */
export const baseVitestConfig: ViteUserConfig = defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.turbo/**'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/**/*.stories.{ts,tsx}',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});

export default baseVitestConfig;
