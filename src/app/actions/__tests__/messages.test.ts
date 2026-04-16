import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendOfferMessageAction } from '../messages';
import * as stackModule from '@/stack/server';
import * as userProfilesModule from '@/lib/services/userProfiles';
import * as offerMessagesModule from '@/lib/services/offerMessages';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('@/stack/server', () => ({
  stackServerApp: {
    getUser: vi.fn(),
  },
}));

vi.mock('@/lib/services/userProfiles', () => ({
  ensureUserProfile: vi.fn(),
}));

vi.mock('@/lib/services/offerMessages', () => ({
  createOfferMessageForUser: vi.fn(),
}));

vi.mock('next/cache');

describe('sendOfferMessageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send a message successfully', async () => {
    const mockUser = { id: 'user-123', displayName: 'Test User' };
    const mockProfile = { userId: 'user-123', role: 'buyer' as const };
    const mockResult = {
      message: {
        id: 'msg-123',
        offerId: 'offer-123',
        senderId: 'user-123',
        senderRole: 'buyer' as const,
        message: 'Hello!',
        createdAt: '2025-01-01T00:00:00.000Z', // Should be string (ISO format)
      },
      context: {
        requestId: 'request-123',
        viewerRole: 'buyer' as const, // Add viewerRole
      },
    };

    vi.mocked(stackModule.stackServerApp.getUser).mockResolvedValue(mockUser as any);
    vi.mocked(userProfilesModule.ensureUserProfile).mockResolvedValue(mockProfile as any);
    vi.mocked(offerMessagesModule.createOfferMessageForUser).mockResolvedValue(mockResult as any);

    const formData = new FormData();
    formData.append('offerId', '123e4567-e89b-12d3-a456-426614174000'); // Valid UUID
    formData.append('message', 'Hello!');

    const result = await sendOfferMessageAction(undefined, formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message.id).toBe('msg-123');
    }
    expect(revalidatePath).toHaveBeenCalledWith('/dealer/offers/123e4567-e89b-12d3-a456-426614174000');
    expect(revalidatePath).toHaveBeenCalledWith('/buyer/requests/request-123');
    expect(revalidatePath).toHaveBeenCalledWith('/buyer/requests/request-123/offers/123e4567-e89b-12d3-a456-426614174000');
  });

  it('should return error if user not logged in', async () => {
    vi.mocked(stackModule.stackServerApp.getUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.append('offerId', 'offer-123');
    formData.append('message', 'Hello!');

    const result = await sendOfferMessageAction(undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Du må være innlogget for å sende meldinger.');
    }
  });

  it('should return error if offerId is invalid', async () => {
    const mockUser = { id: 'user-123', displayName: 'Test User' };
    const mockProfile = { userId: 'user-123', role: 'buyer' as const };

    vi.mocked(stackModule.stackServerApp.getUser).mockResolvedValue(mockUser as any);
    vi.mocked(userProfilesModule.ensureUserProfile).mockResolvedValue(mockProfile as any);

    const formData = new FormData();
    formData.append('offerId', 'not-a-uuid');
    formData.append('message', 'Hello!');

    const result = await sendOfferMessageAction(undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Meldingen må inneholde tekst (maks 2000 tegn).');
    }
  });

  it('should return error if message is empty', async () => {
    const mockUser = { id: 'user-123', displayName: 'Test User' };
    const mockProfile = { userId: 'user-123', role: 'buyer' as const };

    vi.mocked(stackModule.stackServerApp.getUser).mockResolvedValue(mockUser as any);
    vi.mocked(userProfilesModule.ensureUserProfile).mockResolvedValue(mockProfile as any);

    const formData = new FormData();
    formData.append('offerId', '123e4567-e89b-12d3-a456-426614174000');
    formData.append('message', '');

    const result = await sendOfferMessageAction(undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Meldingen må inneholde tekst (maks 2000 tegn).');
    }
  });

  it('should return error if message is too long', async () => {
    const mockUser = { id: 'user-123', displayName: 'Test User' };
    const mockProfile = { userId: 'user-123', role: 'buyer' as const };

    vi.mocked(stackModule.stackServerApp.getUser).mockResolvedValue(mockUser as any);
    vi.mocked(userProfilesModule.ensureUserProfile).mockResolvedValue(mockProfile as any);

    const formData = new FormData();
    formData.append('offerId', '123e4567-e89b-12d3-a456-426614174000');
    formData.append('message', 'a'.repeat(2001));

    const result = await sendOfferMessageAction(undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Meldingen må inneholde tekst (maks 2000 tegn).');
    }
  });

  it('should handle database errors gracefully', async () => {
    const mockUser = { id: 'user-123', displayName: 'Test User' };
    const mockProfile = { userId: 'user-123', role: 'buyer' as const };

    vi.mocked(stackModule.stackServerApp.getUser).mockResolvedValue(mockUser as any);
    vi.mocked(userProfilesModule.ensureUserProfile).mockResolvedValue(mockProfile as any);
    vi.mocked(offerMessagesModule.createOfferMessageForUser).mockRejectedValue(
      new Error('Database error')
    );

    const formData = new FormData();
    formData.append('offerId', '123e4567-e89b-12d3-a456-426614174000');
    formData.append('message', 'Hello!');

    const result = await sendOfferMessageAction(undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Kunne ikke sende meldingen. Prøv igjen.');
    }
  });
});
