// Fails when a built bundle grows by more than maxGrowth over the baseline in
// size-baseline.json. Run after `npm run build`.
import { appendFileSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const { maxGrowth, files } = JSON.parse(
  readFileSync(new URL('../size-baseline.json', import.meta.url), 'utf8'),
);

let failed = false;
const rows = Object.entries(files).map(([file, baseline]) => {
  const size = statSync(file).size;
  const gzip = gzipSync(readFileSync(file)).length;
  const limit = Math.floor(baseline * (1 + maxGrowth));
  const change = (((size - baseline) / baseline) * 100).toFixed(1);
  const ok = size <= limit;
  if (!ok) failed = true;
  return `| ${file} | ${baseline} | ${size} | ${change}% | ${gzip} | ${limit} | ${ok ? 'ok' : 'TOO BIG'} |`;
});

const table = [
  '| file | baseline (B) | size (B) | change | gzip (B) | limit (B) | result |',
  '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
  ...rows,
].join('\n');
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Bundle size\n\n${table}\n`,
  );
}
if (failed) {
  console.error(
    `\nA bundle grew by more than ${maxGrowth * 100}% over size-baseline.json.`,
  );
  process.exit(1);
}
