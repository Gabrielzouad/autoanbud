// src/lib/services/userProfiles.ts
import { db, userProfiles, userRole } from "@/db";
import { eq } from "drizzle-orm";

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
  const [created] = await db
    .insert(userProfiles)
    .values({
      userId: user.id,
      role: "buyer", // change later if you add dealer onboarding flow
    })
    .returning();

  return created;
}
