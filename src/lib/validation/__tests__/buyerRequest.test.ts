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
      };

      const result = createBuyerRequestSchema.safeParse(minimalRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.make).toBe('Ukjent');
        expect(result.data.model).toBe('Ukjent');
      }
    });

    it('should reject request without title', () => {
      const invalidRequest = {
        make: 'Volvo',
        model: 'XC90',
      };

      const result = createBuyerRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should reject request with title too short', () => {
      const invalidRequest = {
        title: 'ab', // Only 2 characters
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

    it('should validate enum values for condition', () => {
      const validConditions = ['new', 'used', 'demo'];

      validConditions.forEach((condition) => {
        const request = {
          title: 'Need a car',
          condition,
        };

        const result = createBuyerRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid condition values', () => {
      const request = {
        title: 'Need a car',
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
          bodyType,
        };

        const result = createBuyerRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should handle boolean values for wantsTradeIn and financingNeeded', () => {
      const request = {
        title: 'Need a car',
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
      };

      const result = createBuyerRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Need a car');
        expect(result.data.make).toBe('Tesla');
        expect(result.data.model).toBe('Model 3');
      }
    });
  });
});
