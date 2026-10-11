import { describe, expect, it } from 'vitest';
import DottedMap from '../src/with-countries';

describe('countries', () => {
  it('fits the region to the selected countries', () => {
    const { region } = new DottedMap({ height: 5, countries: ['FRA'] }).image;
    expect(region.lat.min).toBeCloseTo(41.38, 1);
    expect(region.lat.max).toBeCloseTo(51.15, 1);
    expect(region.lng.min).toBeCloseTo(-4.59, 1);
    expect(region.lng.max).toBeCloseTo(9.56, 1);
  });

  it('fits the region around all selected countries', () => {
    const fra = new DottedMap({ height: 6, countries: ['FRA'] }).image.region;
    const both = new DottedMap({ height: 6, countries: ['FRA', 'ESP'] }).image
      .region;
    expect(both.lat.min).toBeLessThan(fra.lat.min);
    expect(both.lng.min).toBeLessThan(fra.lng.min);
    expect(both.lat.max).toBeCloseTo(fra.lat.max);
  });

  it('keeps only points inside the selected countries', () => {
    const region = { lat: { min: 35, max: 60 }, lng: { min: -10, max: 20 } };
    const key = ({ x, y }: { x: number; y: number }) => `${x};${y}`;
    const all = new DottedMap({ height: 10, region }).getPoints().map(key);
    const fra = new DottedMap({ height: 10, region, countries: ['FRA'] })
      .getPoints()
      .map(key);
    expect(fra.length).toBeGreaterThan(0);
    expect(fra.length).toBeLessThan(all.length);
    expect(all).toEqual(expect.arrayContaining(fra));
  });

  it('accepts an explicit region with countries', () => {
    const region = { lat: { min: 40, max: 52 }, lng: { min: -6, max: 10 } };
    expect(
      new DottedMap({ height: 7, countries: ['FRA'], region }).image.region,
    ).toEqual(region);
  });

  it('treats an empty list as the whole world', () => {
    expect(new DottedMap({ height: 8, countries: [] }).image.region).toEqual(
      new DottedMap({ height: 8 }).image.region,
    );
  });

  it('lists every invalid code in the error', () => {
    expect(
      () => new DottedMap({ height: 5, countries: ['FRA', 'XX', 'YY'] }),
    ).toThrow('Invalid country codes: XX, YY');
  });
});
