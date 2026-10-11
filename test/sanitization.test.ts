// The README promises that user input cannot inject markup or script into
// the SVG. These tests cover each value that reaches the output.
import { describe, expect, it } from 'vitest';
import DottedMap, { getMapJSON } from '../src/with-countries';
import DottedMapWithoutCountries from '../src/without-countries';

const payloads = [
  'javascript:alert(1)',
  '<script>alert(1)</script>',
  '"><script>alert(1)</script>',
  'red" onload="alert(1)',
  "red' onload='alert(1)",
  'red;background:url(javascript:alert(1))',
  'url(#x)',
  'expression(alert(1))',
  '#fff" /><script>alert(1)</script><x a="',
];

const newMap = () => new DottedMap({ height: 6, width: 6, countries: ['DEU'] });

const assertClean = (svg: string) => {
  expect(svg).not.toMatch(/script|alert|onload|javascript|url\(|expression/i);
  // Only the elements the library renders.
  expect(
    svg.match(/<\/?([a-z]+)/g)?.map((t) => t.replace(/[</]/g, '')),
  ).toSatisfy((tags: string[]) =>
    tags.every((t) => ['svg', 'circle', 'polygon'].includes(t)),
  );
};

describe('sanitization', () => {
  it.each(payloads)('replaces color %j with #000000', (color) => {
    const svg = newMap().getSVG({ color });
    assertClean(svg);
    expect(svg).toContain('fill="#000000"');
  });

  it.each(payloads)(
    'replaces backgroundColor %j with #000000',
    (backgroundColor) => {
      const svg = newMap().getSVG({ backgroundColor });
      assertClean(svg);
      expect(svg).toContain('style="background-color: #000000"');
    },
  );

  it.each(payloads)(
    'replaces pin svgOptions.color %j with #000000',
    (color) => {
      const map = new DottedMap({ height: 7, width: 7, countries: ['DEU'] });
      const pin = map.addPin({ lat: 52.52, lng: 13.4, svgOptions: { color } });
      const svg = map.getSVG({ color: '#fff' });
      assertClean(svg);
      expect(svg).toContain(
        `cx="${pin.x}" cy="${pin.y}" r="0.5" fill="#000000"`,
      );
    },
  );

  it('replaces non-string colors with #000000', () => {
    const svg = newMap().getSVG({ color: { toString: () => 'red' } as never });
    expect(svg).toContain('fill="#000000"');
  });

  it.each([
    ['1" onload="alert(1)', '1'],
    ['abc', '0.5'],
    [-1, '0.5'],
    [1001, '0.5'],
  ])('sanitizes radius %j to %s', (radius, expected) => {
    const svg = newMap().getSVG({ radius: radius as number });
    assertClean(svg);
    expect(svg).toContain(`r="${expected}"`);
  });

  it('falls back to circles for an unknown shape', () => {
    const svg = newMap().getSVG({ shape: '<script>' as never });
    assertClean(svg);
    expect(svg).toContain('<circle');
  });

  it('never renders pin data', () => {
    const map = new DottedMap({ height: 8, width: 8, countries: ['DEU'] });
    map.addPin({ lat: 52.52, lng: 13.4, data: '<script>alert(1)</script>' });
    assertClean(map.getSVG({}));
  });

  it.each(['circle', 'hexagon'] as const)(
    'sanitizes point coordinates from a precomputed map (%s)',
    (shape) => {
      const map = JSON.parse(getMapJSON({ height: 5, width: 5 }));
      map.points = {
        a: { x: '1" onload="alert(1)', y: 2 },
        b: { x: 3, y: '<script>alert(1)</script>' },
        c: {
          x: 4,
          y: 5,
          svgOptions: { color: '"><script>', radius: '2" x="' },
        },
      };
      const svg = new DottedMapWithoutCountries({ map }).getSVG({ shape });
      assertClean(svg);
    },
  );
});
