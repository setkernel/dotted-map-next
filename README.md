<!-- Status Badges -->
<div align="center">

[![npm version](https://badge.fury.io/js/@setkernel%2Fdotted-map-next.svg)](https://www.npmjs.com/package/@setkernel/dotted-map-next)
[![CI](https://github.com/setkernel/dotted-map-next/actions/workflows/ci.yml/badge.svg)](https://github.com/setkernel/dotted-map-next/actions/workflows/ci.yml)
[![Dependencies](https://github.com/setkernel/dotted-map-next/actions/workflows/dependencies.yml/badge.svg)](https://github.com/setkernel/dotted-map-next/actions/workflows/dependencies.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@setkernel/dotted-map-next.svg)](https://nodejs.org/)
[![NPM Downloads](https://img.shields.io/npm/dm/@setkernel/dotted-map-next.svg)](https://www.npmjs.com/package/@setkernel/dotted-map-next)
[![TypeScript](https://img.shields.io/badge/types-included-blue.svg)](https://www.typescriptlang.org/)
[![Maintenance](https://img.shields.io/badge/Maintained-Yes-green.svg)](https://github.com/setkernel/dotted-map-next/graphs/commit-activity)

</div>

# @setkernel/dotted-map-next

> 🚀 **Enhanced Edition** - A modern, secure, and high-performance SVG map library with comprehensive improvements!

Create beautiful SVG maps filled with dots for the world or countries with enhanced security, performance, and reliability.

<div align="center">
  <img src="https://raw.githubusercontent.com/NTag/dotted-map/master/images/world-vertical-circle-light.svg" width="100%" />

  <img src="https://raw.githubusercontent.com/NTag/dotted-map/master/images/world-diagonal-circle-dark.svg" width="100%" />

  <img src="https://raw.githubusercontent.com/NTag/dotted-map/master/images/france-diagonal-hexagon-light.svg" height="150px" />
  <img src="https://raw.githubusercontent.com/NTag/dotted-map/master/images/italy-diagonal-hexagon-light.svg" height="150px" />
  <img src="https://raw.githubusercontent.com/NTag/dotted-map/master/images/uk-diagonal-hexagon-light.svg" height="150px" />
  <br />
  <em>Supports world maps or specific countries (France, Italy, UK shown above)</em>
</div>

## ✨ What's New in @setkernel/dotted-map-next

This is an enhanced version of the original `dotted-map` with significant improvements:

### 🔐 **Security Enhancements**
- **SVG sanitization**: colors, radius, shape and point coordinates are sanitized before they reach the SVG, so they cannot inject markup or script (see [Security Features](#security-features))
- **Input Validation**: map settings are validated with descriptive error messages

### ⚡ **Performance**
- **Cached grids**: maps with identical settings are computed once per process
- **Small builds**: minified ES module and CommonJS builds; the precomputed-map entry is under 3 KB

### 🛡️ **Reliability & Quality**
- **Tested**: Vitest suite covering rendering, pins, countries, precomputed maps and sanitization, with coverage thresholds enforced in CI
- **Node.js 20, 22 and 24**: the full check suite runs on each in CI

### 🚀 **Modern Packaging**
- **Written in TypeScript** (`strict`); the published type declarations are generated from the source
- **Dual ES module + CommonJS** builds with an `exports` map: `import` and `require` both work
- **Tree-shakeable** (`"sideEffects": false`)

## Installation

Requires Node.js ≥ 20. For the browser, use it through a bundler that supports the package `exports` field.

```bash
npm install @setkernel/dotted-map-next
```

## Quick Start

```js
const fs = require('fs');
const DottedMap = require('@setkernel/dotted-map-next').default;
// Or, as an ES module: import DottedMap from '@setkernel/dotted-map-next';

const map = new DottedMap({ height: 60, grid: 'diagonal' });

map.addPin({
  lat: 40.73061,
  lng: -73.935242,
  svgOptions: { color: '#d6ff79', radius: 0.4 },
});
map.addPin({
  lat: 48.8534,
  lng: 2.3488,
  svgOptions: { color: '#fffcf2', radius: 0.4 },
});

const svgMap = map.getSVG({
  radius: 0.22,
  color: '#423B38',
  shape: 'circle',
  backgroundColor: '#020300',
});

fs.writeFileSync('./map.svg', svgMap);
```

## Migration from dotted-map

The API is compatible with the original `dotted-map`. Simply replace the import:

```js
// Old
const DottedMap = require('dotted-map').default;

// New
const DottedMap = require('@setkernel/dotted-map-next').default;
```

Existing code works without changes, with one difference: invalid settings (for example a negative height, an unknown grid or an unknown country code) now throw an error with a descriptive message instead of being accepted.

## Migrating from 1.x

Nothing to do. The TypeScript rewrite and the new packaging keep the 1.x API: the same exports (`default` and `getMapJSON`, and the `without-countries` entry), constructor options, methods and type names (including `DottedMapLib` and `DottedMapWithoutCountriesLib`). `require('@setkernel/dotted-map-next').default` still works, and `import DottedMap from '@setkernel/dotted-map-next'` now loads a real ES module build.

Two things to know:

- Node.js 20 or newer is required (Node 14 to 18 are end-of-life).
- The package no longer ships its `src/` folder. It was never importable (the `exports` map did not expose it); the country data lives in the repository at [`src/countries.geo.json`](https://github.com/setkernel/dotted-map-next/blob/main/src/countries.geo.json).

## Performance

If you use a large number of points (height or width ≥ 100), it may take a bit of time to compute the map (from 1 to 30 seconds depending on your device and number of points). This is why the result grid is cached: creating another map with the same settings (`height`, `width`, `countries`, `region`, `grid`) in the same process reuses the computed grid and takes well under a millisecond.

Maps created with the same settings share that cached grid, including pins added with `addPin`. Use different settings, or the [precomputed map](#precomputing-the-map) with a fresh `JSON.parse` per map, if you need independent maps.

## Framework Integration

### React Integration
```jsx
import DottedMap from '@setkernel/dotted-map-next';

const MyMapComponent = () => {
  const map = new DottedMap({ height: 60, grid: 'diagonal' });
  
  // Add your pins
  map.addPin({ lat: 40.7, lng: -74.0, svgOptions: { color: '#ff0000' } });
  
  const svgString = map.getSVG({ shape: 'circle', backgroundColor: '#f0f0f0' });
  
  return (
    <div dangerouslySetInnerHTML={{ __html: svgString }} />
  );
};
```

## Bundle Size Optimization

### Precomputing the map

For browser and React Native apps, you can precompute the grid to reduce bundle size and improve performance:

```js
// Step 1: Precompute during development
const { getMapJSON } = require('@setkernel/dotted-map-next');

const mapJsonString = getMapJSON({ height: 60, grid: 'diagonal' });
console.log(mapJsonString);
// Save this string to a file for your frontend
```

```js
// Step 2: Use lightweight version in your app
import DottedMap from '@setkernel/dotted-map-next/without-countries';
import MyMapString from './myMap'; // Your precomputed map data

const MyComponent = () => {
  // Super fast because it's precomputed ⚡️
  const map = new DottedMap({ map: JSON.parse(MyMapString) });

  map.addPin({
    lat: 40.73061,
    lng: -73.935242,
    svgOptions: { color: '#d6ff79', radius: 0.4 },
  });

  const svgMap = map.getSVG({
    radius: 0.22,
    color: '#423B38',
    shape: 'circle',
    backgroundColor: '#020300',
  });

  return (
    <div>
      <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`} />
    </div>
  );
};
```

### Bundle Size Comparison
| Bundle | Minified | Gzipped | Use Case |
|--------|---------:|--------:|----------|
| `@setkernel/dotted-map-next` | 254 KB | 103 KB | Full functionality with countries (includes the country outlines) |
| `@setkernel/dotted-map-next/without-countries` | 2.6 KB | 1.4 KB | Precomputed maps only |

Sizes of the CommonJS build, excluding the `proj4` and `@turf/boolean-point-in-polygon` dependencies. CI fails if a build grows by more than 10%.

## API Reference

### Constructor Options

```js
import DottedMap from '@setkernel/dotted-map-next';

const map = new DottedMap({
  height: 60,           // Map height in points
  width: 100,           // Map width in points (specify either height or width)
  countries: ['USA', 'CAN'], // ISO 3166-1 alpha-3 codes (see src/countries.geo.json in the repository)
  region: {             // Custom region bounds
    lat: { min: 20, max: 50 },
    lng: { min: -130, max: -60 }
  },
  grid: 'vertical',     // 'vertical' | 'diagonal'
  avoidOuterPins: false // getPin returns undefined outside the land of the map's countries
});
```

### Methods

#### `map.addPin(options)`
Add a pin to the map.

```js
const pin = map.addPin({
  lat: 40.7589,         // Latitude
  lng: -73.9851,        // Longitude
  svgOptions: {         // Visual options
    color: '#ff0000',   // Pin color
    radius: 0.4         // Pin size
  },
  data: { name: 'NYC' } // Custom data
});
```

#### `map.getPin(coordinates)`
Get pin coordinates for a lat/lng position.

```js
const pin = map.getPin({ lat: 40.7589, lng: -73.9851 });
// Returns: { x, y, lat, lng }, or undefined with avoidOuterPins when the
// position is outside the land of the map's countries
```

#### `map.getPoints()`
Get all points on the map.

```js
const points = map.getPoints();
// Returns: [{ x, y, lat, lng, data?, svgOptions? }]
```

#### `map.getSVG(options)`
Generate SVG string.

```js
const svg = map.getSVG({
  shape: 'circle',          // 'circle' | 'hexagon'
  backgroundColor: '#f0f0f0', // Background color (default 'transparent')
  color: '#333333',         // Default point color
  radius: 0.5               // Default point radius (default 0.5)
});
```

### Static Methods

#### `getMapJSON(options)`
Precompute map data for lightweight bundle.

```js
import { getMapJSON } from '@setkernel/dotted-map-next';

const mapData = getMapJSON({ height: 60, grid: 'diagonal' });
```

## Security Features

### Input Sanitization
Settings and pin options are sanitized before they are written into the SVG:

- `color`, `backgroundColor` and pin `svgOptions.color` must be a hex color, `rgb()`, `rgba()`, `hsl()`, `hsla()` or a single word such as a named color; anything else becomes `#000000`
- `radius` and pin `svgOptions.radius` must be a number from 0 to 1000; anything else becomes `0.5`
- `shape` must be `'circle'` or `'hexagon'`; anything else becomes `'circle'`
- point coordinates are parsed as numbers, so a tampered precomputed map cannot inject attributes through them
- pin `data` is never written into the SVG

Precomputed map data passed to `without-countries` should come from `getMapJSON`: its `width` and `height` are written into the SVG `viewBox` as they are.

```js
// Malicious input is safely handled
map.addPin({ 
  lat: 40.7, 
  lng: -73.9, 
  svgOptions: { 
    color: 'javascript:alert(1)' // → Sanitized to '#000000'
  }
});

// XSS attempts are blocked
const svg = map.getSVG({ 
  color: '<script>alert(1)</script>' // → Sanitized to '#000000'
});
```

### Input Validation
Comprehensive validation with helpful error messages:

```js
try {
  new DottedMap({ height: 20000 });
} catch (error) {
  console.error(error.message); // "Height must be a number between 0 and 10000"
}

try {
  new DottedMap({ height: 60, countries: ['INVALID'] });
} catch (error) {
  console.error(error.message); // "Invalid country codes: INVALID"
}
```

## Testing

```bash
npm test                 # Vitest suite
npm run test:coverage    # with coverage thresholds
npm run test:all         # type-check, tests, tests with coverage
npm run test:package     # pack, install the tarball, try import/require and types
```

## Credits and Acknowledgments

### Original Author
- **Basile Bruneau** - Original `dotted-map` library creator

### Enhanced Version Contributors
- **Enhanced by**: Community contributions for security, performance, and reliability improvements
- **Testing**: Vitest suite with coverage thresholds enforced in CI
- **Security**: XSS prevention and input sanitization
- **Performance**: Cache fixes and modern build tools

### Data Sources
- **Countries GeoJSON**: https://github.com/johan/world.geo.json
- **Projection**: proj4js library for coordinate transformations
- **Geometry**: @turf/boolean-point-in-polygon for spatial operations

### Inspiration
This enhanced version was created to address the need for a modern, secure, and high-performance SVG map library while maintaining compatibility with the original `dotted-map` API.

## License

MIT License - see LICENSE file for details.

## Contributing

Issues and pull requests are welcome! Please ensure all tests pass and follow the existing code style.

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (strict)
npm run test:all    # Run all tests
npm run build       # Build the library
npm run format      # Format code
```
