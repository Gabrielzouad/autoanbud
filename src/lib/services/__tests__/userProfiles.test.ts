import { describe, it, expect, vi, beforeEach } from "vitest";
import { ensureUserProfile, isForeignKeyError } from "../userProfiles";
import * as dbModule from "../../../db";

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

      (dbModule.db.select as any) = mockSelect;

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

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      const result = await ensureUserProfile({ id: "new-user-id" });

      expect(result).toEqual(newProfile);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should handle foreign key constraint error (code 23503)", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue({
            code: "23503",
            message: "Foreign key constraint violation",
          }),
        }),
      });

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      const result = await ensureUserProfile({ id: "new-user-id" });

      expect(result).toEqual({
        userId: "new-user-id",
        role: "buyer",
        phone: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
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

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

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

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

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

      (dbModule.db.select as any) = mockSelect;
      (dbModule.db.insert as any) = mockInsert;

      await expect(ensureUserProfile({ id: "test-user-id" })).rejects.toBe(null);
    });

    it("should detect foreign key errors with direct code property", () => {
      expect(isForeignKeyError({ code: "23503" })).toBe(true);
      expect(isForeignKeyError({ code: "23505" })).toBe(false);
      expect(isForeignKeyError({})).toBe(false);
      expect(isForeignKeyError(null)).toBe(false);
      expect(isForeignKeyError("string")).toBe(false);
    });

    it("should detect foreign key errors nested in error.cause", () => {
      expect(isForeignKeyError({ cause: { code: "23503" } })).toBe(true);
      expect(isForeignKeyError({ cause: { code: "23505" } })).toBe(false);
    });
  });
});
