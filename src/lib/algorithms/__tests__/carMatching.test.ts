import { describe, expect, it } from 'vitest';
import { calculateMatchScore, normalizeDealerLocation } from '../carMatching';

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

  it('returns a positive score if dealer has explicit makes and request make is unspecified', () => {
    const request = { ...baseRequest, make: undefined };
    const result = calculateMatchScore(request, baseDealer);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).toContain('Matches XC90 model');
  });

  it('matches fixed requests with unknown make when model and other signals match', () => {
    const request = { ...baseRequest, requestType: 'fixed' as const, make: 'Ukjent' };
    const result = calculateMatchScore(request, baseDealer);

    expect(result.matchType).toBe('fixed');
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).toContain('Matches XC90 model');
  });

  it('returns a broad match for open requests without make or model', () => {
    const request = {
      ...baseRequest,
      requestType: 'open' as const,
      make: undefined,
      model: undefined,
    };

    const result = calculateMatchScore(request, baseDealer);

    expect(result.matchType).toBe('open');
    expect(result.score).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.reasons).toContain('Matches suv body type');
  });

  it('keeps fixed matching strict when request make does not match dealer capabilities', () => {
    const request = { ...baseRequest, requestType: 'fixed' as const, make: 'Audi' };
    const result = calculateMatchScore(request, baseDealer);

    expect(result.matchType).toBe('fixed');
    expect(result.score).toBe(0);
  });
});

describe('normalizeDealerLocation', () => {
  it('accepts jsonb object locations', () => {
    expect(normalizeDealerLocation({ lat: 59.91, lng: 10.75, city: 'Oslo' })).toEqual({
      lat: 59.91,
      lng: 10.75,
      city: 'Oslo',
    });
  });

  it('accepts legacy stringified locations', () => {
    expect(
      normalizeDealerLocation(JSON.stringify({ lat: 59.91, lng: 10.75, city: 'Oslo' })),
    ).toEqual({
      lat: 59.91,
      lng: 10.75,
      city: 'Oslo',
    });
  });

  it('returns null for invalid coordinates', () => {
    expect(normalizeDealerLocation({ lat: 'not-a-number', lng: 10.75 })).toBeNull();
  });

  it('returns null for out-of-range coordinates', () => {
    expect(normalizeDealerLocation({ lat: 91, lng: 10.75 })).toBeNull();
    expect(normalizeDealerLocation({ lat: 59.91, lng: 181 })).toBeNull();
  });
});
