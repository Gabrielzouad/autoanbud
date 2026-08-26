import { describe, it, expect } from 'vitest';
import { createBuyerRequestSchema } from '../buyerRequest';

describe('buyerRequest validation', () => {
  describe('createBuyerRequestSchema', () => {
    it('should validate a complete valid buyer request', () => {
      const validRequest = {
        title: 'Looking for Tesla Model 3',
        make: 'Tesla',
        model: 'Model 3',
        generation: '2021-2023',
        yearFrom: '2020',
        yearTo: '2023',
        maxKm: '50000',
        minKm: '0',
        condition: 'used',
        fuelType: 'ev',
        gearbox: 'automatic',
        bodyType: 'sedan',
        budgetMin: '300000',
        budgetMax: '500000',
        locationCity: 'Oslo',
        locationPostalCode: '0150',
        searchRadiusKm: '100',
        wantsTradeIn: '',
        financingNeeded: 'on',
        description: 'Looking for a well-maintained Tesla Model 3',
      };

      const result = createBuyerRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Looking for Tesla Model 3');
        expect(result.data.make).toBe('Tesla');
        expect(result.data.model).toBe('Model 3');
        expect(result.data.financingNeeded).toBe(true);
        expect(result.data.wantsTradeIn).toBe(false);
      }
    });

    it('should validate a minimal valid buyer request', () => {
      const minimalRequest = {
        title: 'Need a car',
        budgetMax: '250000',
      };

      const result = createBuyerRequestSchema.safeParse(minimalRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requestType).toBe('open');
        expect(result.data.make).toBe('Ukjent');
        expect(result.data.model).toBe('Ukjent');
      }
    });

    it('should map general search submissions to open requests', () => {
      const request = {
        title: 'Family SUV under 400k',
        searchType: 'general',
        bodyType: 'suv',
        budgetMax: '400000',
        seats: '7',
      };

      const result = createBuyerRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requestType).toBe('open');
        expect(result.data.make).toBe('Ukjent');
        expect(result.data.model).toBe('Ukjent');
        expect(result.data.seats).toBe(7);
      }
    });

    it('should reject explicit fixed requests without make and model', () => {
      const request = {
        title: 'Specific car request',
        requestType: 'fixed',
        budgetMax: '500000',
      };

      const result = createBuyerRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.make).toBeDefined();
        expect(errors.model).toBeDefined();
      }
    });

    it('should reject request without title', () => {
      const invalidRequest = {
        make: 'Volvo',
        model: 'XC90',
        budgetMax: '500000',
      };

      const result = createBuyerRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should reject request with title too short', () => {
      const invalidRequest = {
        title: 'ab', // Only 2 characters
        budgetMax: '500000',
      };

      const result = createBuyerRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should handle string numbers for budget fields', () => {
      const requestWithStringNumbers = {
        title: 'Need a car',
        budgetMin: '300000',
        budgetMax: '500000',
      };

      const result = createBuyerRequestSchema.safeParse(requestWithStringNumbers);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budgetMin).toBe(300000);
        expect(result.data.budgetMax).toBe(500000);
      }
    });

    it('should handle formatted number strings for Norwegian-style amounts', () => {
      const requestWithFormattedNumbers = {
        title: 'Need a car',
        budgetMin: '300 000',
        budgetMax: '650.000',
        maxKm: '80,000',
      };

      const result = createBuyerRequestSchema.safeParse(requestWithFormattedNumbers);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budgetMin).toBe(300000);
        expect(result.data.budgetMax).toBe(650000);
        expect(result.data.maxKm).toBe(80000);
      }
    });

    it('should reject missing or zero budget', () => {
      const missingBudget = createBuyerRequestSchema.safeParse({
        title: 'Need a car',
      });
      const zeroBudget = createBuyerRequestSchema.safeParse({
        title: 'Need a car',
        budgetMax: '0',
      });

      expect(missingBudget.success).toBe(false);
      expect(zeroBudget.success).toBe(false);
    });

    it('should reject incomplete or out-of-range location coordinates', () => {
      const incomplete = createBuyerRequestSchema.safeParse({
        title: 'Need a car',
        budgetMax: '500000',
        locationCity: 'Oslo',
        locationLat: '59.91',
      });
      const outOfRange = createBuyerRequestSchema.safeParse({
        title: 'Need a car',
        budgetMax: '500000',
        locationCity: 'Oslo',
        locationLat: '91',
        locationLng: '10.75',
      });

      expect(incomplete.success).toBe(false);
      expect(outOfRange.success).toBe(false);
    });

    it('should validate enum values for condition', () => {
      const validConditions = ['new', 'used', 'demo'];

      validConditions.forEach((condition) => {
        const request = {
          title: 'Need a car',
          budgetMax: '500000',
          condition,
        };

        const result = createBuyerRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid condition values', () => {
      const request = {
        title: 'Need a car',
        budgetMax: '500000',
        condition: 'invalid-condition',
      };

      const result = createBuyerRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should validate enum values for fuelType', () => {
      const validFuelTypes = ['petrol', 'diesel', 'hybrid', 'ev', 'other'];

      validFuelTypes.forEach((fuelType) => {
        const request = {
          title: 'Need a car',
          budgetMax: '500000',
          fuelType,
        };

        const result = createBuyerRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should validate enum values for gearbox', () => {
      const validGearboxTypes = ['automatic', 'manual', 'any'];

      validGearboxTypes.forEach((gearbox) => {
        const request = {
          title: 'Need a car',
          budgetMax: '500000',
          gearbox,
        };

        const result = createBuyerRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should validate enum values for bodyType', () => {
      const validBodyTypes = [
        'suv',
        'sedan',
        'wagon',
        'hatchback',
        'coupe',
        'convertible',
        'van',
        'pickup',
        'other',
      ];

      validBodyTypes.forEach((bodyType) => {
        const request = {
          title: 'Need a car',
          budgetMax: '500000',
          bodyType,
        };

        const result = createBuyerRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should handle boolean values for wantsTradeIn and financingNeeded', () => {
      const request = {
        title: 'Need a car',
        budgetMax: '500000',
        wantsTradeIn: 'on',
        financingNeeded: '',
      };

      const result = createBuyerRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.wantsTradeIn).toBe(true);
        expect(result.data.financingNeeded).toBe(false);
      }
    });

    it('should trim whitespace from text fields', () => {
      const request = {
        title: '  Need a car  ',
        make: '  Tesla  ',
        model: '  Model 3  ',
        budgetMax: '500000',
      };

      const result = createBuyerRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Need a car');
        expect(result.data.make).toBe('Tesla');
        expect(result.data.model).toBe('Model 3');
      }
    });

    it('should normalize fixed request make and model typos', () => {
      const request = {
        title: 'Need a Toyota',
        requestType: 'fixed',
        make: 'toyta',
        model: 'rav 4',
        budgetMax: '500000',
      };

      const result = createBuyerRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.make).toBe('Toyota');
        expect(result.data.model).toBe('RAV4');
      }
    });

    it('should reject unknown fixed request makes', () => {
      const request = {
        title: 'Need a car',
        requestType: 'fixed',
        make: 'not-a-real-make',
        model: 'Whatever',
        budgetMax: '500000',
      };

      const result = createBuyerRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.make).toBeDefined();
      }
    });

    it('should validate image URL lists and limits', () => {
      const request = {
        title: 'Need a car',
        budgetMax: '500000',
        imageUrls: JSON.stringify(['https://example.com/request.jpg']),
        tradeInImageUrls: JSON.stringify(['https://example.com/trade-in.webp']),
      };
      const invalidUrl = createBuyerRequestSchema.safeParse({
        title: 'Need a car',
        budgetMax: '500000',
        imageUrls: JSON.stringify(['not-a-url']),
      });
      const tooManyUrls = createBuyerRequestSchema.safeParse({
        title: 'Need a car',
        budgetMax: '500000',
        imageUrls: JSON.stringify(Array.from({ length: 9 }, (_, index) => `https://example.com/${index}.jpg`)),
      });

      expect(createBuyerRequestSchema.safeParse(request).success).toBe(true);
      expect(invalidUrl.success).toBe(false);
      expect(tooManyUrls.success).toBe(false);
    });
  });
});
