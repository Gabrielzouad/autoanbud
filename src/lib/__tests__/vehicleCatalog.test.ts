import { describe, expect, it } from 'vitest';

import {
  canonicalizeVehicleMake,
  getMakeSuggestions,
  getModelSuggestions,
} from '../vehicleCatalog';

describe('vehicleCatalog', () => {
  it('canonicalizes common make aliases', () => {
    expect(canonicalizeVehicleMake('VW')).toBe('Volkswagen');
    expect(canonicalizeVehicleMake('Mercedes')).toBe('Mercedes-Benz');
  });

  it('suggests makes from partial input', () => {
    expect(getMakeSuggestions('vol')).toContain('Volvo');
  });

  it('suggests models for the selected make', () => {
    expect(getModelSuggestions('Volvo', 'xc')).toEqual(
      expect.arrayContaining(['XC40', 'XC60', 'XC90']),
    );
  });
});
