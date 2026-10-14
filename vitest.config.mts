import { defineConfig } from 'vitest/config';

// Coverage instrumentation slows the grid computation several times over on
// Node 22+, so timing assertions run only without it (see test/legacy.test.ts),
// and the first uncached grid (about 6.5 s on CI runners) gets a longer timeout.
const coverage = process.argv.some((arg) => arg.startsWith('--coverage'));

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    env: coverage ? { DOTTED_MAP_COVERAGE: '1' } : {},
    testTimeout: coverage ? 30_000 : 5_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { lines: 95, functions: 95, statements: 95, branches: 90 },
    },
  },
});
