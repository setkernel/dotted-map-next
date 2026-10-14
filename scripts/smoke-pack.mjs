// Packs the library, installs the tarball in a temporary project and checks
// that `import` and `require` work for both entry points, and that the
// published types resolve for ESM and CJS consumers.
// Usage: node scripts/smoke-pack.mjs (builds, then packs)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (cmd, args, cwd) => {
  console.log(`$ ${[cmd, ...args].join(' ')}`);
  let out;
  try {
    out = execFileSync(cmd, args, { cwd, encoding: 'utf8' });
  } catch (error) {
    console.error(error.stdout, error.stderr);
    throw error;
  }
  if (out.trim()) console.log(out.trim());
  return out;
};

const dir = mkdtempSync(join(tmpdir(), 'dotted-map-next-smoke-'));
try {
  run(npm, ['run', 'build', '--silent'], root);
  const packed = JSON.parse(
    execFileSync(
      npm,
      ['pack', '--json', '--ignore-scripts', '--pack-destination', dir],
      {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    ),
  )[0];
  console.log(`packed ${packed.filename} (${packed.files.length} files)`);
  for (const { path } of packed.files) console.log(`  ${path}`);

  writeFileSync(join(dir, 'package.json'), '{ "private": true }\n');
  run(
    npm,
    ['install', '--no-audit', '--no-fund', join(dir, packed.filename)],
    dir,
  );

  writeFileSync(
    join(dir, 'esm.mjs'),
    `import DottedMap, { getMapJSON } from '@setkernel/dotted-map-next';
import DottedMapWithoutCountries from '@setkernel/dotted-map-next/without-countries';
const map = new DottedMap({ height: 10 });
const svg = map.getSVG({ shape: 'hexagon' });
const light = new DottedMapWithoutCountries({ map: JSON.parse(getMapJSON({ height: 10 })) });
if (!svg.startsWith('<svg') || light.getSVG({ shape: 'hexagon' }) !== svg) throw new Error('ESM output mismatch');
// 1.1.1 served \`import\` from CommonJS, so Node ESM code used pkg.default.
if (DottedMap.default !== DottedMap || DottedMap.getMapJSON !== getMapJSON || DottedMapWithoutCountries.default !== DottedMapWithoutCountries) throw new Error('1.x ESM compatibility members missing');
console.log('ESM ok:', typeof DottedMap, typeof getMapJSON, typeof DottedMapWithoutCountries, map.getPoints().length, 'points');
`,
  );
  writeFileSync(
    join(dir, 'cjs.cjs'),
    `const DottedMap = require('@setkernel/dotted-map-next').default;
const { getMapJSON } = require('@setkernel/dotted-map-next');
const DottedMapWithoutCountries = require('@setkernel/dotted-map-next/without-countries').default;
const map = new DottedMap({ height: 10 });
const svg = map.getSVG({ shape: 'hexagon' });
const light = new DottedMapWithoutCountries({ map: JSON.parse(getMapJSON({ height: 10 })) });
if (!svg.startsWith('<svg') || light.getSVG({ shape: 'hexagon' }) !== svg) throw new Error('CJS output mismatch');
console.log('CJS ok:', typeof DottedMap, typeof getMapJSON, typeof DottedMapWithoutCountries, map.getPoints().length, 'points');
`,
  );
  run(process.execPath, ['esm.mjs'], dir);
  run(process.execPath, ['cjs.cjs'], dir);

  // Types: compile an ESM and a CJS consumer with the repository's tsc.
  const types = `import DottedMap, { getMapJSON, type DottedMapLib } from '@setkernel/dotted-map-next';
import DottedMapWithoutCountries, { type DottedMapWithoutCountriesLib } from '@setkernel/dotted-map-next/without-countries';
const map: DottedMap = new DottedMap({ height: 10, grid: 'diagonal' });
const point: DottedMapLib.Point = map.addPin({ lat: 0, lng: 0 });
const data: DottedMapWithoutCountriesLib.Map = JSON.parse(getMapJSON({ height: 10 }));
const svg: string = new DottedMapWithoutCountries({ map: data }).getSVG({ shape: 'circle' });
// 1.1.1-style Node ESM usage.
const Legacy: typeof DottedMap = DottedMap.default;
const legacyJson: string = DottedMap.getMapJSON({ height: 10 });
const LegacyLight: typeof DottedMapWithoutCountries = DottedMapWithoutCountries.default;
export { point, svg, Legacy, legacyJson, LegacyLight };
`;
  writeFileSync(join(dir, 'types-esm.mts'), types);
  writeFileSync(join(dir, 'types-cjs.cts'), types);
  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  run(
    process.execPath,
    [
      tsc,
      '--noEmit',
      '--strict',
      '--module',
      'nodenext',
      '--moduleResolution',
      'nodenext',
      'types-esm.mts',
      'types-cjs.cts',
    ],
    dir,
  );
  console.log('types ok: nodenext ESM and CJS consumers compile');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
