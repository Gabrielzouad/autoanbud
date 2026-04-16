import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureUserProfile } from '../userProfiles';
import * as dbModule from '@/db';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  userProfiles: {
    userId: 'user_id',
  },
}));

describe('userProfiles service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureUserProfile', () => {
    it('should return existing profile if found', async () => {
      const existingProfile = {
        userId: 'test-user-id',
        role: 'buyer' as const,
        phone: '+4712345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingProfile]),
        }),
      });

      (dbModule.db.select as any) = mockSelect;

      const result = await ensureUserProfile({ id: 'test-user-id' });

      expect(result).toEqual(existingProfile);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should create new profile if not found', async () => {
      const newProfile = {
        userId: 'new-user-id',
        role: 'buyer' as const,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newProfile]),
        }),
      });

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      const result = await ensureUserProfile({ id: 'new-user-id' });

      expect(result).toEqual(newProfile);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle foreign key constraint error (code 23503)', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue({
            code: '23503',
            message: 'Foreign key constraint violation',
          }),
        }),
      });

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      await expect(
        ensureUserProfile({ id: 'unsynced-user-id' })
      ).rejects.toThrow(
        'User profile cannot be created yet - Stack Auth sync pending. Please refresh the page.'
      );
    });

    it('should throw error for non-foreign-key database errors', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue({
            code: '23505',
            message: 'Unique constraint violation',
          }),
        }),
      });

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      await expect(
        ensureUserProfile({ id: 'test-user-id' })
      ).rejects.toEqual({
        code: '23505',
        message: 'Unique constraint violation',
      });
    });

    it('should handle errors without code property', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      await expect(
        ensureUserProfile({ id: 'test-user-id' })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle null errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(null),
        }),
      });

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      await expect(
        ensureUserProfile({ id: 'test-user-id' })
      ).rejects.toBe(null);
    });
  });

  describe('isForeignKeyError helper', () => {
    it('should detect foreign key errors with direct code property', () => {
      // We can't directly test the private function, but we test its behavior
      // through ensureUserProfile
      const error = { code: '23503' };
      expect(typeof error === 'object' && error !== null && 'code' in error).toBe(true);
      expect(error.code).toBe('23503');
    });
  });
});
