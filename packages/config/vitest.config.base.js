import { defineConfig } from 'vitest/config';

/**
 * Configuration Vitest partagee. Gardee en JavaScript pour que Vitest
 * puisse la charger directement via l'export de paquet.
 */
const baseVitestConfig = defineConfig({
  test: {
    globals: false,
    environment: 'node',
    passWithNoTests: true,
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

export { baseVitestConfig };
export default baseVitestConfig;
