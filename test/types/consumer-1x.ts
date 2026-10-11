// Compile-only check (`npm run typecheck`): code written against the
// hand-written 1.x declarations must keep compiling against the generated ones.
import DottedMap, { getMapJSON, DottedMapLib } from '../../src/with-countries';
import DottedMapWithoutCountries, {
  DottedMapWithoutCountriesLib,
} from '../../src/without-countries';

const region: DottedMapLib.Region = {
  lat: { min: -50, max: 70 },
  lng: { min: -170, max: 170 },
};
const mapSettings: DottedMapLib.MapSettings = {
  height: 10,
  countries: ['FRA'],
  region,
  grid: 'diagonal',
};
const settings: DottedMapLib.Settings = {
  ...mapSettings,
  avoidOuterPins: true,
};

const map: DottedMap = new DottedMap(settings);
const pinInput: DottedMapLib.Pin = {
  lat: 1,
  lng: 2,
  data: { anything: true },
  svgOptions: { color: '#fff', radius: 0.4 } satisfies DottedMapLib.SvgOptions,
};
const added: DottedMapLib.Point = map.addPin(pinInput);
const found: DottedMapLib.Point = map.getPin({ lat: 1, lng: 2 });
const points: DottedMapLib.Point[] = map.getPoints();
const svgSettings: DottedMapLib.SvgSettings = {
  shape: 'hexagon',
  color: '#000',
  backgroundColor: 'transparent',
  radius: 0.5,
};
const svg: string = map.getSVG(svgSettings);
const image: { region: DottedMapLib.Region; width: number; height: number } =
  map.image;
const json: string = getMapJSON(mapSettings);

class Extended extends DottedMap {}
const extended: DottedMap = new Extended({ width: 10 });

const precomputed: DottedMapWithoutCountriesLib.Map = JSON.parse(json);
const wcSettings: DottedMapWithoutCountriesLib.Settings = {
  map: precomputed,
  avoidOuterPins: false,
};
const wc: DottedMapWithoutCountries = new DottedMapWithoutCountries(wcSettings);
const wcPin: DottedMapWithoutCountriesLib.Point = wc.addPin({ lat: 0, lng: 0 });
const wcSvg: string = wc.getSVG({ shape: 'circle' });

// 1.x declared `points` as Point[]; arrays still type-check.
const arrayMap: DottedMapWithoutCountriesLib.Map = {
  ...precomputed,
  points: [] as DottedMapWithoutCountriesLib.Point[],
};
new DottedMapWithoutCountries({ map: arrayMap });

export const used = [added, found, points, svg, image, extended, wcPin, wcSvg];
