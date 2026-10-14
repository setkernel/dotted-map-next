import { describe, expect, it } from 'vitest';
import DottedMap, { getMapJSON } from '../src/with-countries';
import * as withoutCountries from '../src/without-countries';
import DottedMapWithoutCountries from '../src/without-countries';

const settings = { height: 12, grid: 'diagonal' } as const;
const precomputed = () => JSON.parse(getMapJSON(settings));

describe('getMapJSON', () => {
  it('serializes the grid, projection bounds and outline', () => {
    const map = precomputed();
    expect(Object.keys(map)).toEqual([
      'points',
      'X_MIN',
      'Y_MIN',
      'X_MAX',
      'Y_MAX',
      'X_RANGE',
      'Y_RANGE',
      'region',
      'grid',
      'height',
      'width',
      'ystep',
      'poly',
    ]);
    expect(map.grid).toBe('diagonal');
    expect(map.poly.geometry.type).toBe('MultiPolygon');
  });

  it('applies the same validation as the constructor', () => {
    expect(() => getMapJSON({ height: -1 })).toThrow('positive');
  });
});

describe('without-countries entry', () => {
  it('exports only the default constructor at runtime', () => {
    expect(Object.keys(withoutCountries)).toEqual(['default']);
  });

  it('renders the same SVG as the full build', () => {
    const full = new DottedMap({ height: 13 });
    const light = new DottedMapWithoutCountries({
      map: JSON.parse(getMapJSON({ height: 13 })),
    });
    const options = { shape: 'hexagon', color: '#423B38' } as const;
    expect(light.getSVG(options)).toBe(full.getSVG(options));
    expect(light.getPoints()).toEqual(full.getPoints());
    expect(light.image).toEqual(full.image);
  });

  it('places pins like the full build', () => {
    const full = new DottedMap({ ...settings });
    const light = new DottedMapWithoutCountries({ map: precomputed() });
    const pin = { lat: 40.73061, lng: -73.935242 };
    expect(light.getPin(pin)).toEqual(full.getPin(pin));
  });

  it('adds pins and returns them from getPoints', () => {
    const map = new DottedMapWithoutCountries({ map: precomputed() });
    const before = map.getPoints().length;
    const point = map.addPin({ lat: 0, lng: -30, data: 42 });
    expect(point.data).toBe(42);
    expect(map.getPoints()).toHaveLength(before + 1);
  });

  it('honours avoidOuterPins with the precomputed outline', () => {
    const map = new DottedMapWithoutCountries({
      map: precomputed(),
      avoidOuterPins: true,
    });
    expect(map.getPin({ lat: 0, lng: -30 })).toBeUndefined();
    expect(map.getPin({ lat: 48.85, lng: 2.35 })).toBeDefined();
  });

  it('ignores avoidOuterPins when the map has no outline', () => {
    const { poly: _poly, ...map } = precomputed();
    const light = new DottedMapWithoutCountries({ map, avoidOuterPins: true });
    expect(light.getPin({ lat: 0, lng: -30 })).toBeDefined();
  });

  it('accepts points as an array (1.x declared Point[])', () => {
    const map = { ...precomputed(), points: [{ x: 1, y: 2 }] };
    const light = new DottedMapWithoutCountries({ map });
    expect(light.getSVG({})).toContain('<circle cx="1" cy="2"');
  });
});
