import proj4 from 'proj4';
import inside from '@turf/boolean-point-in-polygon';
import { def } from './projection';

export interface Region {
  lat: { min: number; max: number };
  lng: { min: number; max: number };
}

export type Grid = 'vertical' | 'diagonal';

export type Shape = 'circle' | 'hexagon';

export interface SvgOptions {
  color?: string;
  radius?: number;
}

export interface Pin {
  lat: number;
  lng: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- public API since 1.0
  data?: any;
  svgOptions?: SvgOptions;
}

export interface SvgSettings {
  shape?: Shape;
  color?: string;
  backgroundColor?: string;
  radius?: number;
}

export interface Point {
  x: number;
  y: number;
  lat: number;
  lng: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- public API since 1.0
  data?: any;
  svgOptions?: SvgOptions;
}

/** Land outline used by `avoidOuterPins`, as produced by `getMapJSON`. */
export interface MultiPolygonFeature {
  type: 'Feature';
  geometry: { type: 'MultiPolygon'; coordinates: number[][][][] };
}

/** A precomputed map, for example `JSON.parse(getMapJSON(settings))`. */
export interface MapData {
  /**
   * Typed as in 1.x. `getMapJSON` actually produces an object keyed by grid
   * position (`"x;y"`); both forms are accepted.
   */
  points: Point[];
  X_MIN: number;
  Y_MAX: number;
  X_RANGE: number;
  Y_RANGE: number;
  region: Region;
  grid: Grid;
  width: number;
  height: number;
  ystep: number;
  poly?: MultiPolygonFeature;
}

export interface WithoutCountriesSettings {
  map: MapData;
  avoidOuterPins?: boolean;
}

export interface Image {
  region: Region;
  width: number;
  height: number;
}

/** The object returned by `new DottedMap(...)` and `new DottedMapWithoutCountries(...)`. */
export interface DottedMapInstance {
  addPin(pin: Pin): Point;
  /** Note: returns `undefined` when `avoidOuterPins` is set and the pin is outside the land outline. */
  getPin(pin: Pin): Point;
  getPoints(): Point[];
  getSVG(settings: SvgSettings): string;
  image: Image;
}

export interface DottedMapWithoutCountriesConstructor {
  new (settings: WithoutCountriesSettings): DottedMapInstance;
  /** The constructor itself; see the note at the end of this file. */
  default: DottedMapWithoutCountriesConstructor;
}

// Type names exported by the hand-written declarations of 1.x. The aliases
// avoid self-references inside the namespace.
type RegionType = Region;
type SvgOptionsType = SvgOptions;
type PinType = Pin;
type SvgSettingsType = SvgSettings;
type PointType = Point;

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace DottedMapWithoutCountriesLib {
  export type Region = RegionType;
  export type Map = MapData;
  export type Settings = WithoutCountriesSettings;
  export type SvgOptions = SvgOptionsType;
  export type Pin = PinType;
  export type SvgSettings = SvgSettingsType;
  export type Point = PointType;
}

type InsidePolygon = Parameters<typeof inside>[1];

// SVG sanitization functions to prevent XSS
const sanitizeColor = (color: unknown): string => {
  if (typeof color !== 'string') return '#000000';
  // Allow hex colors (#000, #000000), named colors, rgb(), rgba(), hsl(), hsla()
  const validColorRegex =
    /^(#[0-9A-Fa-f]{3,6}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)|transparent|currentColor|inherit|[a-zA-Z]+)$/;
  return validColorRegex.test(color.trim()) ? color.trim() : '#000000';
};

const sanitizeRadius = (radius: unknown): number => {
  const num = parseFloat(radius as string);
  return isNaN(num) || num < 0 || num > 1000 ? 0.5 : num;
};

const sanitizeNumericValue = (value: unknown, fallback = 0): number => {
  const num = parseFloat(value as string);
  return isNaN(num) ? fallback : num;
};

function createDottedMapWithoutCountries({
  map,
  avoidOuterPins = false,
}: WithoutCountriesSettings): DottedMapInstance {
  const {
    X_MIN,
    Y_MAX,
    X_RANGE,
    Y_RANGE,
    region,
    grid,
    width,
    height,
    ystep,
    poly, // polygon data for avoidOuterPins feature
  } = map;
  // An object keyed by grid position (from getMapJSON) or an array; pins are
  // added by key either way.
  const points = map.points as unknown as Record<string, Point>;

  const mapInstance: DottedMapInstance = {
    addPin({ lat, lng, data, svgOptions }) {
      const pin = mapInstance.getPin({ lat, lng });
      const point = { ...pin, data, svgOptions };

      points[[point.x, point.y].join(';')] = point;

      return point;
    },
    getPin({ lat, lng }) {
      const [googleX, googleY] = proj4(def('GOOGLE'), [lng, lat]);
      if (avoidOuterPins && poly) {
        const wgs84Point = proj4(def('GOOGLE'), def('WGS84'), [
          googleX,
          googleY,
        ]);
        // Kept from 1.x: callers get undefined here although the type says Point.
        if (!inside(wgs84Point, poly as InsidePolygon))
          return undefined as unknown as Point;
      }
      let [rawX, rawY] = [
        (width * (googleX - X_MIN)) / X_RANGE,
        (height * (Y_MAX - googleY)) / Y_RANGE,
      ];
      const y = Math.round(rawY / ystep);
      if (y % 2 === 0 && grid === 'diagonal') {
        rawX -= 0.5;
      }
      const x = Math.round(rawX);
      let [localx, localy] = [x, Math.round(y) * ystep];
      if (y % 2 === 0 && grid === 'diagonal') {
        localx += 0.5;
      }

      const [localLng, localLat] = proj4(def('GOOGLE'), def('WGS84'), [
        (localx * X_RANGE) / width + X_MIN,
        Y_MAX - (localy * Y_RANGE) / height,
      ]);

      const pin = { x: localx, y: localy, lat: localLat, lng: localLng };

      return pin;
    },
    getPoints() {
      return Object.values(points);
    },
    getSVG({
      shape = 'circle',
      color = 'current',
      backgroundColor = 'transparent',
      radius = 0.5,
    }) {
      // Sanitize main parameters
      const sanitizedShape = ['circle', 'hexagon'].includes(shape)
        ? shape
        : 'circle';
      const sanitizedColor = sanitizeColor(color);
      const sanitizedBackgroundColor = sanitizeColor(backgroundColor);
      const sanitizedRadius = sanitizeRadius(radius);

      const getPoint = ({ x, y, svgOptions = {} }: Point) => {
        // Sanitize coordinates and options
        const sanitizedX = sanitizeNumericValue(x, 0);
        const sanitizedY = sanitizeNumericValue(y, 0);
        const pointRadius = sanitizeRadius(
          svgOptions.radius || sanitizedRadius,
        );
        const pointColor = sanitizeColor(svgOptions.color || sanitizedColor);

        if (sanitizedShape === 'circle') {
          return `<circle cx="${sanitizedX}" cy="${sanitizedY}" r="${pointRadius}" fill="${pointColor}" />`;
        } else if (sanitizedShape === 'hexagon') {
          const sqrt3radius = Math.sqrt(3) * pointRadius;

          const polyPoints = [
            [sanitizedX + sqrt3radius, sanitizedY - pointRadius],
            [sanitizedX + sqrt3radius, sanitizedY + pointRadius],
            [sanitizedX, sanitizedY + 2 * pointRadius],
            [sanitizedX - sqrt3radius, sanitizedY + pointRadius],
            [sanitizedX - sqrt3radius, sanitizedY - pointRadius],
            [sanitizedX, sanitizedY - 2 * pointRadius],
          ];

          return `<polygon points="${polyPoints
            .map((point) => point.join(','))
            .join(' ')}" fill="${pointColor}" />`;
        }
      };

      return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: ${sanitizedBackgroundColor}">
        ${Object.values(points).map(getPoint).join('\n')}
      </svg>`;
    },
    image: {
      region,
      width,
      height,
    },
  };

  return mapInstance;
}

// A plain function, so `new` returns the instance object (methods do not rely
// on `this` and can be destructured), exactly as in 1.x.
const DottedMapWithoutCountries =
  createDottedMapWithoutCountries as unknown as DottedMapWithoutCountriesConstructor;
type DottedMapWithoutCountries = DottedMapInstance;

// 1.x served Node's `import` condition from a CommonJS build, so Node ES module
// code received the whole exports object and used `pkg.default`. Keep that
// working now that `import` loads a real ES module.
DottedMapWithoutCountries.default = DottedMapWithoutCountries;

export default DottedMapWithoutCountries;
