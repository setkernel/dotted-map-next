import { describe, expect, it } from 'vitest';
import DottedMap from '../src/with-countries';

describe('SVG snapshots', () => {
  it.each(['circle', 'hexagon'] as const)('%s', (shape) => {
    const map = new DottedMap({
      height: 5,
      countries: ['ITA'],
      grid: 'diagonal',
    });
    map.addPin({
      lat: 41.9,
      lng: 12.5,
      svgOptions: { color: '#d6ff79', radius: 0.4 },
    });
    expect(
      map.getSVG({
        shape,
        color: '#423B38',
        backgroundColor: '#020300',
        radius: 0.22,
      }),
    ).toMatchSnapshot();
  });
});
