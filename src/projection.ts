import proj4 from 'proj4';

type Projection = Exclude<Parameters<typeof proj4>[0], string>;

/**
 * `proj4.defs(name)`, typed as a projection argument: proj4 accepts the
 * definition objects it returns, but its type declarations do not.
 */
export const def = (name: 'GOOGLE' | 'WGS84'): Projection =>
  proj4.defs(name) as unknown as Projection;
