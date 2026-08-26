import { describe, expect, it } from 'vitest';

import {
  canonicalizeVehicleMake,
  canonicalizeVehicleModel,
  getMakeSuggestions,
  getModelSuggestions,
  normalizeVehicleMake,
} from '../vehicleCatalog';

describe('vehicleCatalog', () => {
  it('canonicalizes common make aliases', () => {
    expect(canonicalizeVehicleMake('VW')).toBe('Volkswagen');
    expect(canonicalizeVehicleMake('Mercedes')).toBe('Mercedes-Benz');
  });

  it('normalizes common make typos and accented input', () => {
    expect(normalizeVehicleMake('toyta')).toEqual({
      make: 'Toyota',
      confidence: 'fuzzy',
    });
    expect(canonicalizeVehicleMake('volvå')).toBe('Volvo');
  });

  it('normalizes model typos for a known make', () => {
    expect(canonicalizeVehicleModel('Volvo', 'xc9')).toBe('XC90');
    expect(canonicalizeVehicleModel('Tesla', 'model-y')).toBe('Model Y');
  });

  it('suggests makes from partial input', () => {
    expect(getMakeSuggestions('vol')).toContain('Volvo');
    expect(getMakeSuggestions('toyta')).toContain('Toyota');
  });

  it('suggests models for the selected make', () => {
    expect(getModelSuggestions('Volvo', 'xc')).toEqual(
      expect.arrayContaining(['XC40', 'XC60', 'XC90']),
    );
  });
});
