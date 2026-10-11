import proj4 from 'proj4';
import inside from '@turf/boolean-point-in-polygon';
import { def } from './projection';
import DottedMapWithoutCountries from './without-countries';
import type {
  DottedMapInstance,
  Grid,
  MultiPolygonFeature,
  Pin,
  Point,
  Region,
  SvgOptions,
  SvgSettings,
} from './without-countries';

// The JSON is bundled into the build output.
import geojsonWorldData from './countries.geo.json';

export type {
  DottedMapInstance,
  Grid,
  Image,
  MultiPolygonFeature,
  Pin,
  Point,
  Region,
  Shape,
  SvgOptions,
  SvgSettings,
} from './without-countries';

export interface MapSettings {
  height?: number;
  width?: number;
  countries?: string[];
  region?: Region;
  grid?: Grid;
}

export interface Settings extends MapSettings {
  avoidOuterPins?: boolean;
}

export interface DottedMapConstructor {
  new (settings: Settings): DottedMapInstance;
}

// Type names exported by the hand-written declarations of 1.x. The aliases
// avoid self-references inside the namespace.
type RegionType = Region;
type MapSettingsType = MapSettings;
type SettingsType = Settings;
type SvgOptionsType = SvgOptions;
type PinType = Pin;
type SvgSettingsType = SvgSettings;
type PointType = Point;

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace DottedMapLib {
  export type Region = RegionType;
  export type MapSettings = MapSettingsType;
  export type Settings = SettingsType;
  export type SvgOptions = SvgOptionsType;
  export type Pin = PinType;
  export type SvgSettings = SvgSettingsType;
  export type Point = PointType;
}

type Polygon = { type: 'Polygon'; coordinates: number[][][] };
type MultiPolygon = { type: 'MultiPolygon'; coordinates: number[][][][] };
type CountryFeature = {
  type: 'Feature';
  id: string;
  properties: { name: string };
  geometry: Polygon | MultiPolygon;
};
type FeatureCollection = {
  type: 'FeatureCollection';
  features: CountryFeature[];
};
type InsidePolygon = Parameters<typeof inside>[1];

const geojsonWorld = geojsonWorldData as unknown as FeatureCollection;

const geojsonByCountry = geojsonWorld.features.reduce<
  Record<string, CountryFeature>
>((countries, feature) => {
  countries[feature.id] = feature;
  return countries;
}, {});

const geojsonToMultiPolygons = (
  geojson: FeatureCollection,
): MultiPolygonFeature => {
  const coordinates = geojson.features.reduce<number[][][][]>(
    (poly, feature) =>
      poly.concat(
        feature.geometry.type === 'Polygon'
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates,
      ),
    [],
  );
  return { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates } };
};

const CACHE: Record<string, ComputedMap> = {};

const DEFAULT_WORLD_REGION: Region = {
  lat: { min: -56, max: 71 },
  lng: { min: -179, max: 179 },
};

const computeGeojsonBox = (
  geojson: FeatureCollection | CountryFeature | Polygon | MultiPolygon,
): Region => {
  if (geojson.type === 'FeatureCollection') {
    const boxes = geojson.features.map(computeGeojsonBox);
    return {
      lat: {
        min: Math.min(...boxes.map((box) => box.lat.min)),
        max: Math.max(...boxes.map((box) => box.lat.max)),
      },
      lng: {
        min: Math.min(...boxes.map((box) => box.lng.min)),
        max: Math.max(...boxes.map((box) => box.lng.max)),
      },
    };
  } else if (geojson.type === 'Feature') {
    return computeGeojsonBox(geojson.geometry);
  } else if (geojson.type === 'MultiPolygon') {
    return computeGeojsonBox({
      type: 'Polygon',
      coordinates: geojson.coordinates.flat(),
    });
  } else if (geojson.type === 'Polygon') {
    const coords = geojson.coordinates.flat();
    const latitudes = coords.map(([, lat]) => lat);
    const longitudes = coords.map(([lng]) => lng);

    return {
      lat: {
        min: Math.min(...latitudes),
        max: Math.max(...latitudes),
      },
      lng: {
        min: Math.min(...longitudes),
        max: Math.max(...longitudes),
      },
    };
  } else {
    throw new Error(
      `Unknown geojson type ${(geojson as { type: string }).type}`,
    );
  }
};

const validateMapSettings = ({
  height,
  width,
  countries,
  region,
  grid,
}: MapSettings) => {
  if ((height as number) <= 0 && (width as number) <= 0) {
    throw new Error('Either height or width must be positive');
  }

  if (
    height !== undefined &&
    (typeof height !== 'number' || height < 0 || height > 10000)
  ) {
    throw new Error('Height must be a number between 0 and 10000');
  }

  if (
    width !== undefined &&
    (typeof width !== 'number' || width < 0 || width > 10000)
  ) {
    throw new Error('Width must be a number between 0 and 10000');
  }

  if (countries && !Array.isArray(countries)) {
    throw new Error('Countries must be an array');
  }

  if (countries && countries.length > 0) {
    const validCountries = new Set(Object.keys(geojsonByCountry));
    const invalidCountries = countries.filter((c) => !validCountries.has(c));
    if (invalidCountries.length > 0) {
      throw new Error(`Invalid country codes: ${invalidCountries.join(', ')}`);
    }
  }

  if (grid && !['vertical', 'diagonal'].includes(grid)) {
    throw new Error('Grid must be "vertical" or "diagonal"');
  }

  if (region) {
    if (typeof region !== 'object' || !region.lat || !region.lng) {
      throw new Error('Region must have lat and lng properties');
    }

    if (
      typeof region.lat.min !== 'number' ||
      typeof region.lat.max !== 'number' ||
      typeof region.lng.min !== 'number' ||
      typeof region.lng.max !== 'number'
    ) {
      throw new Error('Region coordinates must be numbers');
    }

    if (region.lat.min >= region.lat.max || region.lng.min >= region.lng.max) {
      throw new Error('Region min values must be less than max values');
    }
  }
};

const getMap = ({
  height = 0,
  width = 0,
  countries = [],
  region,
  grid = 'vertical',
}: MapSettings) => {
  validateMapSettings({ height, width, countries, region, grid });

  if (height <= 0 && width <= 0) {
    throw new Error('height or width is required');
  }

  let geojson = geojsonWorld;
  if (countries.length > 0) {
    geojson = {
      type: 'FeatureCollection',
      features: countries.map((country) => geojsonByCountry[country]),
    };
    if (!region) {
      region = computeGeojsonBox(geojson);
    }
  } else if (!region) {
    region = DEFAULT_WORLD_REGION;
  }

  const poly = geojsonToMultiPolygons(geojson);

  const [X_MIN, Y_MIN] = proj4(def('GOOGLE'), [region.lng.min, region.lat.min]);
  const [X_MAX, Y_MAX] = proj4(def('GOOGLE'), [region.lng.max, region.lat.max]);
  const X_RANGE = X_MAX - X_MIN;
  const Y_RANGE = Y_MAX - Y_MIN;

  if (width <= 0) {
    width = Math.round((height * X_RANGE) / Y_RANGE);
  } else if (height <= 0) {
    height = Math.round((width * Y_RANGE) / X_RANGE);
  }

  const points: Record<string, { x: number; y: number }> = {};
  const ystep = grid === 'diagonal' ? Math.sqrt(3) / 2 : 1;

  for (let y = 0; y * ystep < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const localx = y % 2 === 0 && grid === 'diagonal' ? x + 0.5 : x;
      const localy = y * ystep;

      const pointGoogle = [
        (localx / width) * X_RANGE + X_MIN,
        Y_MAX - (localy / height) * Y_RANGE,
      ];
      const wgs84Point = proj4(def('GOOGLE'), def('WGS84'), pointGoogle);

      if (inside(wgs84Point, poly as InsidePolygon)) {
        points[[x, y].join(';')] = { x: localx, y: localy };
      }
    }
  }

  return {
    points,
    X_MIN,
    Y_MIN,
    X_MAX,
    Y_MAX,
    X_RANGE,
    Y_RANGE,
    region,
    grid,
    height,
    width,
    ystep,
    poly, // include polygon data for avoidOuterPins feature
  };
};

type ComputedMap = ReturnType<typeof getMap>;

export const getMapJSON = (props: MapSettings): string =>
  JSON.stringify(getMap(props));

const getCacheKey = ({
  height = 0,
  width = 0,
  countries = [],
  region,
  grid = 'vertical',
}: MapSettings) => {
  return [
    JSON.stringify(region),
    grid,
    height,
    width,
    JSON.stringify(countries),
  ].join(' ');
};

function createDottedMap({
  avoidOuterPins = false,
  ...args
}: Settings): DottedMapInstance {
  const cacheKey = getCacheKey(args);

  if (!CACHE[cacheKey]) {
    CACHE[cacheKey] = getMap(args);
  }

  return new DottedMapWithoutCountries({
    avoidOuterPins,
    // Grid points carry only x and y until pins are added.
    map: CACHE[cacheKey] as (typeof CACHE)[string] & {
      points: Record<string, Point>;
    },
  });
}

// A plain function, so `new` returns the instance object (methods do not rely
// on `this` and can be destructured), exactly as in 1.x.
const DottedMap = createDottedMap as unknown as DottedMapConstructor;
type DottedMap = DottedMapInstance;

export default DottedMap;
