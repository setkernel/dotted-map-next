// Port of the 1.x scripts test.js and test.enhanced.js. Every original
// assertion is kept, in the original order, with the original messages.
import { describe, expect, it } from 'vitest';
import DottedMap, { getMapJSON } from '../src/with-countries';
import DottedMapWithoutCountries from '../src/without-countries';

// Timing assertions are meaningless under coverage instrumentation; they run
// in `npm test`, which CI runs on every Node version.
const timed = it.skipIf(process.env.DOTTED_MAP_COVERAGE === '1');

describe('test.js (README example)', () => {
  it('runs the README example without throwing', () => {
    const map = new DottedMap({ height: 60, grid: 'diagonal' });

    map.addPin({
      lat: 40.73061,
      lng: -73.935242,
      svgOptions: { color: '#d6ff79', radius: 0.4 },
    });
    map.getPin({ lat: 40.73061, lng: -73.935242 });
    map.getSVG({
      radius: 0.22,
      color: '#423B38',
      shape: 'circle',
      backgroundColor: '#020300',
    });
  });
});

describe('Basic Functionality Tests', () => {
  it('Creates map with valid parameters', () => {
    const map = new DottedMap({ height: 10, grid: 'diagonal' });
    expect(map, 'Map should be created').not.toBeNull();
  });

  it('Creates map with width instead of height', () => {
    const map = new DottedMap({ width: 10, grid: 'vertical' });
    expect(map, 'Map should be created with width').not.toBeNull();
  });

  it('Adds pin successfully', () => {
    const map = new DottedMap({ height: 10 });
    const pin = map.addPin({ lat: 0, lng: 0 });
    expect(pin.x, 'Pin should have x coordinate').not.toBeUndefined();
    expect(pin.y, 'Pin should have y coordinate').not.toBeUndefined();
  });

  it('Gets pin coordinates', () => {
    const map = new DottedMap({ height: 10 });
    const pin = map.getPin({ lat: 0, lng: 0 });
    expect(typeof pin.x, 'Pin x should be a number').toBe('number');
    expect(typeof pin.y, 'Pin y should be a number').toBe('number');
  });

  it('Generates SVG output', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    const svg = map.getSVG({ color: '#ff0000' });
    expect(svg, 'Should generate SVG').toContain('<svg');
    expect(svg, 'Should have SVG namespace').toContain(
      'xmlns="http://www.w3.org/2000/svg"',
    );
  });
});

describe('Cache Performance Tests', () => {
  timed('Cache works for identical parameters', () => {
    const start1 = Date.now();
    new DottedMap({ height: 30, grid: 'diagonal' });
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    new DottedMap({ height: 30, grid: 'diagonal' });
    const time2 = Date.now() - start2;

    expect(
      time2 < time1 * 0.1,
      `Cache should be much faster: ${time1}ms vs ${time2}ms`,
    ).toBe(true);
  });

  it('Cache creates different maps for different parameters', () => {
    const map1 = new DottedMap({ height: 10, grid: 'diagonal' });
    const map2 = new DottedMap({ height: 10, grid: 'vertical' });

    const points1 = map1.getPoints();
    const points2 = map2.getPoints();

    // Points should be different due to different grid types
    expect(
      points1.length !== points2.length ||
        points1[0].x !== points2[0].x ||
        points1[0].y !== points2[0].y,
      'Different parameters should create different maps',
    ).toBe(true);
  });
});

describe('Input Validation Tests', () => {
  it('Rejects negative height', () => {
    expect(
      () => new DottedMap({ height: -1 }),
      'Should throw for negative height',
    ).toThrow('positive');
  });

  it('Rejects invalid grid type', () => {
    expect(
      () =>
        new DottedMap({ height: 10, grid: 'invalid' as unknown as 'vertical' }),
      'Should throw for invalid grid type',
    ).toThrow('vertical');
  });

  it('Rejects invalid countries format', () => {
    expect(
      () =>
        new DottedMap({ height: 10, countries: 'USA' as unknown as string[] }),
      'Should throw for non-array countries',
    ).toThrow('array');
  });

  it('Rejects invalid country codes', () => {
    expect(
      () => new DottedMap({ height: 10, countries: ['INVALID'] }),
      'Should throw for invalid country codes',
    ).toThrow('Invalid country codes');
  });

  it('Accepts valid country codes', () => {
    const map = new DottedMap({ height: 10, countries: ['USA', 'FRA'] });
    expect(map, 'Should accept valid country codes').not.toBeNull();
  });
});

describe('SVG Security Tests', () => {
  it('Sanitizes malicious color input', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    map.addPin({
      lat: 0,
      lng: 0,
      svgOptions: { color: 'javascript:alert(1)' },
    });
    const svg = map.getSVG({ shape: 'circle' });
    expect(svg, 'Should not contain javascript:').not.toContain('javascript:');
    expect(svg, 'Should not contain alert').not.toContain('alert');
  });

  it('Sanitizes script tags in color', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    const svg = map.getSVG({ color: '<script>alert(1)</script>' });
    expect(svg, 'Should not contain script tags').not.toContain('<script');
    expect(svg, 'Should not contain alert').not.toContain('alert');
  });

  it('Allows valid hex colors', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    const svg = map.getSVG({ color: '#ff0000' });
    expect(svg, 'Should preserve valid hex colors').toContain('#ff0000');
  });

  it('Allows valid RGB colors', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    const svg = map.getSVG({ color: 'rgb(255, 0, 0)' });
    expect(svg, 'Should preserve valid RGB colors').toContain('rgb(255, 0, 0)');
  });

  it('Sanitizes invalid radius values', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    map.addPin({
      lat: 0,
      lng: 0,
      svgOptions: { radius: 'invalid' as unknown as number },
    });
    const svg = map.getSVG({ shape: 'circle' });
    expect(
      svg,
      'Should fallback to default radius for invalid input',
    ).toContain('r="0.5"');
  });
});

describe('Shape Generation Tests', () => {
  it('Generates circles correctly', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    const svg = map.getSVG({ shape: 'circle' });
    expect(svg, 'Should generate circle elements').toContain('<circle');
    expect(svg, 'Should have cx attribute').toContain('cx=');
    expect(svg, 'Should have cy attribute').toContain('cy=');
    expect(svg, 'Should have r attribute').toContain('r=');
  });

  it('Generates hexagons correctly', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    const svg = map.getSVG({ shape: 'hexagon' });
    expect(svg, 'Should generate polygon elements').toContain('<polygon');
    expect(svg, 'Should have points attribute').toContain('points=');
  });

  it('Defaults to circles for invalid shape', () => {
    const map = new DottedMap({ height: 5, width: 5 });
    const svg = map.getSVG({ shape: 'invalid' as unknown as 'circle' });
    expect(svg, 'Should fallback to circles for invalid shape').toContain(
      '<circle',
    );
  });
});

describe('Performance Tests', () => {
  timed('Handles moderate size maps efficiently', () => {
    const start = Date.now();
    const map = new DottedMap({ height: 50, width: 50 });
    const svg = map.getSVG({ shape: 'circle' });
    const elapsed = Date.now() - start;

    expect(
      elapsed < 1000,
      `50x50 map should be created in <1s, took ${elapsed}ms`,
    ).toBe(true);
    expect(svg.length > 0, 'Should generate non-empty SVG').toBe(true);
  });

  it('SVG output size is reasonable', () => {
    const map = new DottedMap({ height: 10, width: 10 });
    const svg = map.getSVG({ shape: 'circle' });
    const sizeKB = svg.length / 1024;

    expect(
      sizeKB < 50,
      `SVG should be <50KB for 10x10 map, was ${sizeKB.toFixed(1)}KB`,
    ).toBe(true);
  });
});

describe('JSON Export Tests', () => {
  it('getMapJSON exports valid JSON', () => {
    const jsonString = getMapJSON({ height: 5, width: 5 });
    expect(typeof jsonString, 'Should return string').toBe('string');

    const parsed = JSON.parse(jsonString);
    expect(parsed.points, 'Should contain points').not.toBeUndefined();
    expect(parsed.width, 'Should contain width').not.toBeUndefined();
    expect(parsed.height, 'Should contain height').not.toBeUndefined();
  });

  it('Exported JSON can be used with DottedMapWithoutCountries', () => {
    const jsonString = getMapJSON({ height: 5, width: 5 });
    const mapData = JSON.parse(jsonString);

    const map = new DottedMapWithoutCountries({ map: mapData });
    const svg = map.getSVG({ shape: 'circle' });

    expect(svg, 'Should generate valid SVG from exported JSON').toContain(
      '<svg',
    );
  });
});
