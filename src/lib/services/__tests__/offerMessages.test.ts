import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOfferMessageForUser,
  listOfferMessagesForUser,
} from '../offerMessages';
import * as dbModule from '@/db';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  offerMessages: {},
  offers: {},
  buyerRequests: {},
  userProfiles: {},
  dealerships: {},
}));

describe('offerMessages service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOfferMessageForUser', () => {
    it('should create a message successfully for a buyer', async () => {
      const mockContextRow = {
        offer: {
          id: 'offer-123',
          requestId: 'request-123',
          dealershipId: 'dealer-123',
          dealerUserId: 'dealer-user-123',
        },
        request: {
          id: 'request-123',
          buyerId: 'buyer-user-123',
        },
        dealership: {
          id: 'dealer-123',
          ownerId: 'dealer-user-123',
        },
      };

      const newMessage = {
        id: 'message-123',
        offerId: 'offer-123',
        senderId: 'buyer-user-123',
        senderRole: 'buyer' as const,
        message: 'Is this car still available?',
        createdAt: new Date(),
      };

      // Mock for context lookup
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([mockContextRow]),
            }),
          }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newMessage]),
        }),
      });

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      const result = await createOfferMessageForUser(
        'offer-123',
        'buyer-user-123',
        'Is this car still available?'
      );

      expect(result.message.message).toBe('Is this car still available?');
      expect(result.context.requestId).toBe('request-123');
      expect(result.context.viewerRole).toBe('buyer');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw error if offer not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      (dbModule.db.select as any) = mockSelect;

      await expect(
        createOfferMessageForUser('non-existent-offer', 'user-123', 'Hello')
      ).rejects.toThrow('Offer not found');
    });

    it('should throw error if user not authorized', async () => {
      const mockContextRow = {
        offer: {
          id: 'offer-123',
          requestId: 'request-123',
          dealerUserId: 'dealer-user-123',
        },
        request: {
          id: 'request-123',
          buyerId: 'buyer-user-123',
        },
        dealership: {
          id: 'dealer-123',
          ownerId: 'dealer-user-123',
        },
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([mockContextRow]),
            }),
          }),
        }),
      });

      (dbModule.db.select as any) = mockSelect;

      await expect(
        createOfferMessageForUser('offer-123', 'unauthorized-user', 'Hello')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('listOfferMessagesForUser', () => {
    it('should list messages for an offer', async () => {
      const mockContextRow = {
        offer: {
          id: 'offer-123',
          requestId: 'request-123',
          dealerUserId: 'dealer-user-123',
        },
        request: {
          id: 'request-123',
          buyerId: 'buyer-123',
        },
        dealership: {
          id: 'dealer-123',
          ownerId: 'dealer-user-123',
        },
      };

      const mockMessages = [
        {
          id: 'msg-1',
          offerId: 'offer-123',
          senderId: 'buyer-123',
          senderRole: 'buyer' as const,
          message: 'Is this available?',
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'msg-2',
          offerId: 'offer-123',
          senderId: 'dealer-123',
          senderRole: 'dealer' as const,
          message: 'Yes, it is!',
          createdAt: new Date('2025-01-02'),
        },
      ];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([mockContextRow]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockMessages),
            }),
          }),
        });

      (dbModule.db.select as any) = mockSelect;

      const result = await listOfferMessagesForUser('offer-123', 'buyer-123');

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].message).toBe('Is this available?');
      expect(result.messages[1].message).toBe('Yes, it is!');
      expect(result.context.requestId).toBe('request-123');
    });

    it('should return empty messages array if no messages', async () => {
      const mockContextRow = {
        offer: {
          id: 'offer-123',
          requestId: 'request-123',
          dealerUserId: 'dealer-user-123',
        },
        request: {
          id: 'request-123',
          buyerId: 'buyer-123',
        },
        dealership: {
          id: 'dealer-123',
          ownerId: 'dealer-user-123',
        },
      };

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([mockContextRow]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      (dbModule.db.select as any) = mockSelect;

      const result = await listOfferMessagesForUser('offer-123', 'buyer-123');

      expect(result.messages).toEqual([]);
      expect(result.context.requestId).toBe('request-123');
    });
  });
});
