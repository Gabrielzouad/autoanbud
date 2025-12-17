// src/lib/services/userProfiles.ts
import { db, userProfiles } from "@/db";
import { eq } from "drizzle-orm";
import type { PgDatabaseError } from "postgres";

// Type is loose here – we only care about id
type StackUser = {
  id: string;
};

export async function ensureUserProfile(user: StackUser) {
  // Try to find existing profile
  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id));

  if (existing) return existing;

  // Create with default role "buyer"
  try {
    const [created] = await db
      .insert(userProfiles)
      .values({
        userId: user.id,
        role: "buyer", // change later if you add dealer onboarding flow
      })
      .returning();

    return created;
  } catch (error) {
    // If the auth user hasn't been synced into neon_auth.users_sync yet, skip
    // persistence so the UI can still render with a sensible default.
    if (isForeignKeyError(error)) {
      return {
        userId: user.id,
        role: "buyer",
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies typeof userProfiles.$inferSelect;
    }

    throw error;
  }
}

function isForeignKeyError(error: unknown): error is PgDatabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as PgDatabaseError).code === "23503"
  );
}
