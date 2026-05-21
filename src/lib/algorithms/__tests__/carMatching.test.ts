import { describe, expect, it } from 'vitest';
import { calculateMatchScore } from '../carMatching';

const baseRequest = {
  id: 'req-1',
  make: 'Volvo',
  model: 'XC90',
  yearFrom: 2020,
  yearTo: 2024,
  maxKm: 50000,
  fuelType: 'petrol',
  gearbox: 'automatic',
  bodyType: 'suv',
  budgetMax: 700000,
  locationLat: 59.91,
  locationLng: 10.75,
};

const baseDealer = {
  dealershipId: 'dealer-1',
  makes: ['volvo'],
  models: ['xc90'],
  minYear: 2015,
  maxYear: 2025,
  maxKm: 100000,
  fuelTypes: ['petrol'],
  gearboxTypes: ['automatic'],
  bodyTypes: ['suv'],
  maxPrice: 800000,
  serviceRadius: 100,
  location: { lat: 59.91, lng: 10.75, city: 'Oslo' },
};

describe('calculateMatchScore', () => {
  it('returns 0 if dealer has explicit makes and request make does not match', () => {
    const request = { ...baseRequest, make: 'Audi' };
    const result = calculateMatchScore(request, baseDealer);
    expect(result.score).toBe(0);
  });

  it('returns a positive score when the request make matches', () => {
    const result = calculateMatchScore(baseRequest, baseDealer);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).toContain('Specializes in Volvo');
  });

  it('returns 0 if dealer has explicit makes and request make is unspecified', () => {
    const request = { ...baseRequest, make: undefined };
    const result = calculateMatchScore(request, baseDealer as any);
    expect(result.score).toBe(0);
  });
});
