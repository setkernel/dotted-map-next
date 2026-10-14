import { defineConfig } from 'tsup';

// Output goes to the package root (index.js/.mjs/.d.ts/.d.mts and the same for
// without-countries) so `main` and the publish workflows' paths keep working.
// Never enable `clean` here: with outDir '.', it would wipe the repository.
export default defineConfig({
  entry: {
    index: 'src/with-countries.ts',
    'without-countries': 'src/without-countries.ts',
  },
  outDir: '.',
  format: ['esm', 'cjs'],
  target: 'es2020',
  platform: 'neutral',
  splitting: false,
  dts: true,
  minify: true,
  clean: false,
  external: ['proj4', '@turf/boolean-point-in-polygon'],
  loader: { '.json': 'json' },
});
