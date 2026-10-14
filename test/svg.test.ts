import { describe, expect, it } from 'vitest';
import DottedMap from '../src/with-countries';

// Small country map: few points, fast to compute.
const newMap = () => new DottedMap({ height: 6, width: 6, countries: ['FRA'] });

const elements = (svg: string) =>
  svg.match(/<(circle|polygon) [^>]*\/>/g) ?? [];

describe('getSVG', () => {
  it('renders one element per point', () => {
    const map = newMap();
    const svg = map.getSVG({});
    expect(elements(svg)).toHaveLength(map.getPoints().length);
  });

  it('uses circles, a transparent background and radius 0.5 by default', () => {
    const svg = newMap().getSVG({});
    expect(svg).toContain('style="background-color: transparent"');
    expect(elements(svg).every((el) => el.startsWith('<circle'))).toBe(true);
    expect(elements(svg).every((el) => el.includes('r="0.5"'))).toBe(true);
  });

  it('sets the viewBox from the map size', () => {
    const map = newMap();
    expect(map.getSVG({})).toContain(
      `viewBox="0 0 ${map.image.width} ${map.image.height}"`,
    );
  });

  it.each([
    ['circle', '<circle'],
    ['hexagon', '<polygon'],
  ] as const)('shape %s renders %s elements', (shape, tag) => {
    const svg = newMap().getSVG({ shape });
    expect(elements(svg).every((el) => el.startsWith(tag))).toBe(true);
  });

  it.each(['#abc', '#a1b2c3', 'red', 'rgb(1, 2, 3)', 'rgba(1, 2, 3, 0.5)'])(
    'applies color %s to every point',
    (color) => {
      const svg = newMap().getSVG({ color });
      expect(elements(svg).every((el) => el.includes(`fill="${color}"`))).toBe(
        true,
      );
    },
  );

  it.each(['#020300', 'hsl(120, 50%, 50%)', 'hsla(120, 50%, 50%, 0.3)'])(
    'applies backgroundColor %s',
    (backgroundColor) => {
      expect(newMap().getSVG({ backgroundColor })).toContain(
        `style="background-color: ${backgroundColor}"`,
      );
    },
  );

  it('trims whitespace around colors', () => {
    const svg = newMap().getSVG({ color: '  #123456  ' });
    expect(svg).toContain('fill="#123456"');
  });

  it('applies the radius to circles', () => {
    const svg = newMap().getSVG({ shape: 'circle', radius: 0.22 });
    expect(elements(svg).every((el) => el.includes('r="0.22"'))).toBe(true);
  });

  it('sizes hexagons from the radius', () => {
    const map = new DottedMap({ height: 7, width: 7, countries: ['ITA'] });
    const [{ x, y }] = map.getPoints();
    const svg = map.getSVG({ shape: 'hexagon', radius: 1 });
    const s = Math.sqrt(3);
    const expected = [
      [x + s, y - 1],
      [x + s, y + 1],
      [x, y + 2],
      [x - s, y + 1],
      [x - s, y - 1],
      [x, y - 2],
    ]
      .map((p) => p.join(','))
      .join(' ');
    expect(svg).toContain(`<polygon points="${expected}"`);
  });

  it.each([
    ['circle', 'hexagon'],
    ['hexagon', 'circle'],
  ] as const)(
    'combines shape %s with color, backgroundColor and radius',
    (shape, other) => {
      const svg = newMap().getSVG({
        shape,
        color: '#423B38',
        backgroundColor: '#020300',
        radius: 0.3,
      });
      expect(svg).toContain('style="background-color: #020300"');
      expect(svg).not.toContain(other === 'circle' ? '<circle' : '<polygon');
      expect(elements(svg).every((el) => el.includes('fill="#423B38"'))).toBe(
        true,
      );
    },
  );

  it('lets pin svgOptions override color and radius', () => {
    const map = new DottedMap({ height: 8, width: 8, countries: ['ESP'] });
    const pin = map.addPin({
      lat: 40.4,
      lng: -3.7,
      svgOptions: { color: '#d6ff79', radius: 0.4 },
    });
    const svg = map.getSVG({ color: '#000', radius: 0.2 });
    expect(svg).toContain(
      `<circle cx="${pin.x}" cy="${pin.y}" r="0.4" fill="#d6ff79" />`,
    );
    expect(svg).toContain('r="0.2" fill="#000"');
  });

  it('falls back to the map radius when a pin radius is 0', () => {
    const map = new DottedMap({ height: 9, width: 9, countries: ['ESP'] });
    const pin = map.addPin({ lat: 40.4, lng: -3.7, svgOptions: { radius: 0 } });
    expect(map.getSVG({ radius: 0.3 })).toContain(
      `<circle cx="${pin.x}" cy="${pin.y}" r="0.3"`,
    );
  });
});
