import { describe, expect, it } from 'vitest';
import DottedMap from '../src/with-countries';

// Maps are cached by settings and share their points, so every test uses
// settings of its own.

describe('getPin', () => {
  it('snaps a coordinate to the grid and returns its position', () => {
    const map = new DottedMap({ height: 20 });
    const pin = map.getPin({ lat: 48.85, lng: 2.35 });
    expect(Number.isInteger(pin.x)).toBe(true);
    expect(Number.isInteger(pin.y)).toBe(true);
    expect(pin.lat).toBeCloseTo(48.85, -1);
    expect(Math.abs(pin.lng - 2.35)).toBeLessThan(10);
  });

  it('does not add a point', () => {
    const map = new DottedMap({ height: 21 });
    const before = map.getPoints().length;
    map.getPin({ lat: 0, lng: -30 });
    expect(map.getPoints()).toHaveLength(before);
  });

  it('offsets every other row on a diagonal grid', () => {
    const map = new DottedMap({ height: 22, grid: 'diagonal' });
    const pin = map.getPin({ lat: 48.85, lng: 2.35 });
    expect(pin.y / (Math.sqrt(3) / 2)).toBeCloseTo(
      Math.round(pin.y / (Math.sqrt(3) / 2)),
    );
    expect(pin.x % 1).toBe(
      Math.round(pin.y / (Math.sqrt(3) / 2)) % 2 === 0 ? 0.5 : 0,
    );
  });

  it('returns undefined outside the land outline with avoidOuterPins', () => {
    const map = new DottedMap({ height: 23, avoidOuterPins: true });
    expect(map.getPin({ lat: 0, lng: -30 })).toBeUndefined();
    expect(map.getPin({ lat: 48.85, lng: 2.35 })).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
    });
  });

  it('keeps pins outside the land outline without avoidOuterPins', () => {
    const map = new DottedMap({ height: 24 });
    expect(map.getPin({ lat: 0, lng: -30 })).toBeDefined();
  });
});

describe('addPin', () => {
  it('returns the snapped point with its data and svgOptions', () => {
    const map = new DottedMap({ height: 25 });
    const data = { city: 'Paris' };
    const svgOptions = { color: '#fff', radius: 0.4 };
    const point = map.addPin({ lat: 48.85, lng: 2.35, data, svgOptions });
    expect(point).toEqual({
      ...map.getPin({ lat: 48.85, lng: 2.35 }),
      data,
      svgOptions,
    });
  });

  it('adds an ocean pin to getPoints', () => {
    const map = new DottedMap({ height: 26 });
    const before = map.getPoints().length;
    const point = map.addPin({ lat: 0, lng: -30, data: 'ocean' });
    expect(map.getPoints()).toHaveLength(before + 1);
    expect(map.getPoints()).toContainEqual(point);
  });

  it('replaces the grid point it lands on (vertical grid)', () => {
    const map = new DottedMap({ height: 27 });
    const before = map.getPoints().length;
    const point = map.addPin({ lat: 48.85, lng: 2.35, data: 'paris' });
    expect(map.getPoints()).toHaveLength(before);
    expect(
      map.getPoints().filter((p) => p.x === point.x && p.y === point.y),
    ).toEqual([point]);
  });

  it('replaces an earlier pin at the same grid position', () => {
    const map = new DottedMap({ height: 28 });
    map.addPin({ lat: 0, lng: -30, data: 'first' });
    const count = map.getPoints().length;
    map.addPin({ lat: 0, lng: -30, data: 'second' });
    expect(map.getPoints()).toHaveLength(count);
    expect(map.getPoints().map((p) => p.data)).toContain('second');
    expect(map.getPoints().map((p) => p.data)).not.toContain('first');
  });
});

describe('getPoints', () => {
  it('returns grid points inside the map', () => {
    const map = new DottedMap({ height: 29 });
    const points = map.getPoints();
    expect(points.length).toBeGreaterThan(0);
    for (const { x, y } of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(map.image.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(map.image.height);
    }
  });

  it('uses integer rows on a vertical grid and sqrt(3)/2 steps on a diagonal one', () => {
    const vertical = new DottedMap({ height: 31 }).getPoints();
    expect(vertical.every(({ y }) => Number.isInteger(y))).toBe(true);
    const diagonal = new DottedMap({
      height: 31,
      grid: 'diagonal',
    }).getPoints();
    const ystep = Math.sqrt(3) / 2;
    expect(
      diagonal.every(
        ({ y }) => Math.abs(y / ystep - Math.round(y / ystep)) < 1e-9,
      ),
    ).toBe(true);
  });
});

describe('constructor and image', () => {
  it('derives width from height and height from width', () => {
    const byHeight = new DottedMap({ height: 32 });
    expect(byHeight.image.height).toBe(32);
    expect(byHeight.image.width).toBeGreaterThan(32);
    const byWidth = new DottedMap({ width: 64 });
    expect(byWidth.image.width).toBe(64);
    expect(byWidth.image.height).toBeLessThan(64);
  });

  it('uses the default world region', () => {
    expect(new DottedMap({ height: 33 }).image.region).toEqual({
      lat: { min: -56, max: 71 },
      lng: { min: -179, max: 179 },
    });
  });

  it('uses a custom region', () => {
    const region = { lat: { min: 35, max: 60 }, lng: { min: -10, max: 20 } };
    expect(new DottedMap({ height: 10, region }).image.region).toEqual(region);
  });

  it.each([
    [{ height: 10, width: 10001 }, 'Width must be'],
    [{ height: 10001 }, 'Height must be'],
    [{ height: '10' }, 'Height must be'],
    [{ height: 10, region: { lat: { min: 0, max: 1 } } }, 'lat and lng'],
    [
      {
        height: 10,
        region: { lat: { min: 0, max: '1' }, lng: { min: 0, max: 1 } },
      },
      'must be numbers',
    ],
    [
      {
        height: 10,
        region: { lat: { min: 1, max: 0 }, lng: { min: 0, max: 1 } },
      },
      'less than max',
    ],
    [{}, 'positive'],
  ])('rejects %j', (settings, message) => {
    expect(() => new DottedMap(settings as never)).toThrow(message);
  });

  it('keeps methods usable when destructured, as in 1.x', () => {
    const { getPin, addPin, getPoints, getSVG } = new DottedMap({ height: 34 });
    const point = addPin({ lat: 0, lng: -30 });
    expect(getPin({ lat: 0, lng: -30 })).toMatchObject({
      x: point.x,
      y: point.y,
    });
    expect(getPoints()).toContainEqual(point);
    expect(getSVG({})).toContain('<svg');
  });
});
