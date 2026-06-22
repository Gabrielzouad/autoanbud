import { describe, it, expect, vi, beforeEach } from "vitest";
import { ensureUserProfile } from "../userProfiles";
import * as dbModule from "../../../db";

function mockDbSelect(mockSelect: unknown) {
  (
    dbModule.db as { select: typeof dbModule.db.select }
  ).select = mockSelect as typeof dbModule.db.select;
}

function mockDbInsert(mockInsert: unknown) {
  (
    dbModule.db as { insert: typeof dbModule.db.insert }
  ).insert = mockInsert as typeof dbModule.db.insert;
}

describe("userProfiles service", () => {
  describe("ensureUserProfile", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return existing profile if found", async () => {
      const existingProfile = {
        userId: "existing-user-id",
        role: "buyer",
        phone: "12345678",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingProfile]),
        }),
      });

      mockDbSelect(mockSelect);

      const result = await ensureUserProfile({ id: "existing-user-id" });

      expect(result).toEqual(existingProfile);
      expect(mockSelect).toHaveBeenCalled();
    });

    it("should create new profile if not found", async () => {
      const newProfile = {
        userId: "unsynced-user-id",
        role: "buyer" as const,
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

      mockDbSelect(mockSelect);
      mockDbInsert(mockInsert);

      const result = await ensureUserProfile({ id: "new-user-id" });

      expect(result).toEqual(newProfile);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should throw error for non-foreign-key database errors", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue({
            code: "23505",
            message: "Unique constraint violation",
          }),
        }),
      });

      mockDbSelect(mockSelect);
      mockDbInsert(mockInsert);

      await expect(ensureUserProfile({ id: "test-user-id" })).rejects.toEqual({
        code: "23505",
        message: "Unique constraint violation",
      });
    });

    it("should handle errors without code property", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error("Some other error")),
        }),
      });

      mockDbSelect(mockSelect);
      mockDbInsert(mockInsert);

      await expect(ensureUserProfile({ id: "test-user-id" })).rejects.toThrow("Some other error");
    });

    it("should handle null errors gracefully", async () => {
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

      mockDbSelect(mockSelect);
      mockDbInsert(mockInsert);

      await expect(ensureUserProfile({ id: "test-user-id" })).rejects.toBe(null);
    });
  });
});
