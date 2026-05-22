import { describe, expect, it } from 'vitest';

import {
  calculateOfferCompletenessScore,
  MIN_OFFER_COMPLETENESS_SCORE,
} from '../offerCompleteness';

describe('offerCompleteness', () => {
  it('allows a complete core offer without financing or optional extras', () => {
    const result = calculateOfferCompletenessScore({
      carMake: 'Volvo',
      carModel: 'XC90',
      carYear: 2021,
      carKm: 45000,
      priceTotal: 650000,
    });

    expect(result.score).toBe(MIN_OFFER_COMPLETENESS_SCORE);
    expect(result.isSubmittable).toBe(true);
    expect(result.missingRequiredFields).toEqual([]);
    expect(result.optionalGaps).toContain('finansiering');
  });

  it('blocks when required core offer fields are missing', () => {
    const result = calculateOfferCompletenessScore({
      carMake: 'Volvo',
      priceTotal: 650000,
      financingPossible: true,
    });

    expect(result.isSubmittable).toBe(false);
    expect(result.missingRequiredFields).toEqual([
      'modell',
      'årsmodell',
      'kilometerstand',
    ]);
  });

  it('rewards value-add details without making them mandatory', () => {
    const result = calculateOfferCompletenessScore({
      carMake: 'Volvo',
      carModel: 'XC90',
      carYear: 2021,
      carKm: 45000,
      priceTotal: 650000,
      deliveryTimeEstimate: '1 uke',
      warrantySummary: '12 måneders bruktbilgaranti',
      shortMessageToBuyer: 'Dette er en godt utstyrt bil som matcher behovet.',
      inspectionIncluded: true,
    });

    expect(result.score).toBe(95);
    expect(result.isSubmittable).toBe(true);
    expect(result.optionalGaps).toEqual(['finansiering']);
  });
});
