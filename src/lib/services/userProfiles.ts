// src/lib/services/userProfiles.ts
import { db, userProfiles } from "@/db";
import { eq } from "drizzle-orm";

// Type is loose here – we only care about id
type StackUser = {
  id: string;
};

export async function ensureUserProfile(user: StackUser) {
  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id));

  if (existing) return existing;

  const [created] = await db
    .insert(userProfiles)
    .values({
      userId: user.id,
      role: "buyer",
    })
    .returning();

  return created;
}
