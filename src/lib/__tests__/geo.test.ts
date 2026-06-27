import { describe, expect, it } from 'vitest';

import { normalizeCoordinates } from '../geo';

describe('normalizeCoordinates', () => {
  it('accepts valid numeric coordinates', () => {
    expect(normalizeCoordinates(59.91, 10.75)).toEqual({
      lat: 59.91,
      lng: 10.75,
    });
  });

  it('accepts valid string coordinates', () => {
    expect(normalizeCoordinates('59.91', '10.75')).toEqual({
      lat: 59.91,
      lng: 10.75,
    });
  });

  it('rejects incomplete coordinate pairs', () => {
    expect(normalizeCoordinates(59.91, null)).toBeNull();
    expect(normalizeCoordinates(null, 10.75)).toBeNull();
  });

  it('rejects out-of-range coordinates', () => {
    expect(normalizeCoordinates(91, 10.75)).toBeNull();
    expect(normalizeCoordinates(59.91, 181)).toBeNull();
  });
});
