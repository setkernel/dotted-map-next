// 1.x served Node's `import` condition from a CommonJS build, so Node ES module
// code wrote `pkg.default` and `pkg.getMapJSON`. Both still have to work.
import { describe, expect, it } from 'vitest';
import DottedMap, { getMapJSON } from '../src/with-countries';
import DottedMapWithoutCountries from '../src/without-countries';

describe('1.x Node ES module usage', () => {
  it('exposes the constructor and getMapJSON on the default export', () => {
    expect(DottedMap.default).toBe(DottedMap);
    expect(DottedMap.getMapJSON).toBe(getMapJSON);
    const pkg = DottedMap;
    expect(new pkg.default({ height: 5 }).getPoints()).toEqual(
      new DottedMap({ height: 5 }).getPoints(),
    );
  });

  it('exposes the constructor on the without-countries default export', () => {
    expect(DottedMapWithoutCountries.default).toBe(DottedMapWithoutCountries);
    const map = JSON.parse(getMapJSON({ height: 5 }));
    expect(new DottedMapWithoutCountries.default({ map }).getSVG({})).toBe(
      new DottedMapWithoutCountries({ map }).getSVG({}),
    );
  });
});
