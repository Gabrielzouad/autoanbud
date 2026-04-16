import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listBuyerRequestsForBuyer } from '../buyerRequests';
import * as dbModule from '@/db';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
  buyerRequests: {},
}));

describe('buyerRequests service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listBuyerRequestsForBuyer', () => {
    it('should list all buyer requests for a user', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          buyerId: 'buyer-123',
          status: 'open',
          title: 'Looking for Tesla',
          make: 'Tesla',
          model: 'Model 3',
          yearFrom: 2020,
          budgetMax: 500000,
          locationCity: 'Oslo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'req-2',
          buyerId: 'buyer-123',
          status: 'accepted',
          title: 'Need Volvo XC90',
          make: 'Volvo',
          model: 'XC90',
          yearFrom: 2019,
          budgetMax: 600000,
          locationCity: 'Bergen',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockRequests),
          }),
        }),
      });

      (dbModule.db.select as any) = mockSelect;

      const result = await listBuyerRequestsForBuyer('buyer-123');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Looking for Tesla');
      expect(result[1].title).toBe('Need Volvo XC90');
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should return empty array if user has no requests', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      (dbModule.db.select as any) = mockSelect;

      const result = await listBuyerRequestsForBuyer('buyer-with-no-requests');

      expect(result).toEqual([]);
    });

    it('should order requests by creation date', async () => {
      const mockRequests = [
        {
          id: 'req-2',
          buyerId: 'buyer-123',
          title: 'Newer request',
          createdAt: new Date('2025-01-02'),
        },
        {
          id: 'req-1',
          buyerId: 'buyer-123',
          title: 'Older request',
          createdAt: new Date('2025-01-01'),
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockRequests),
          }),
        }),
      });

      (dbModule.db.select as any) = mockSelect;

      const result = await listBuyerRequestsForBuyer('buyer-123');

      expect(result[0].title).toBe('Newer request');
      expect(result[1].title).toBe('Older request');
    });
  });
});
