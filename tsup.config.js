import { defineConfig } from 'tsup';

// Output goes to the package root (index.js, index.mjs, without-countries.js,
// without-countries.mjs) so `main` and existing deep paths keep working.
// Never enable `clean` here: with outDir '.', it would wipe the repository.
export default defineConfig({
  entry: {
    index: 'src/with-countries.js',
    'without-countries': 'src/without-countries.js',
  },
  outDir: '.',
  format: ['esm', 'cjs'],
  target: 'es2020',
  platform: 'neutral',
  splitting: false,
  minify: true,
  clean: false,
  external: ['proj4', '@turf/boolean-point-in-polygon'],
  loader: { '.json': 'json' },
});
