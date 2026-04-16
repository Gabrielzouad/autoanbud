'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { stackServerApp } from '@/stack/server';
import { db, userProfiles } from '@/db';

type SelectRoleResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

export async function selectRoleAction(
  role: 'buyer' | 'dealer',
): Promise<SelectRoleResult> {
  try {
    // 1. Verify user is authenticated
    const user = await stackServerApp.getUser();
    if (!user) {
      return { success: false, error: 'Du må være innlogget' };
    }

    // 2. Validate role
    if (role !== 'buyer' && role !== 'dealer') {
      return { success: false, error: 'Ugyldig rolle' };
    }

    // 3. Check if user profile exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id));

    // 4. If profile exists with a role, don't allow changing it
    if (existingProfile && existingProfile.role && existingProfile.role !== 'buyer') {
      // If role is already set (and not the default 'buyer'), redirect to appropriate page
      const redirectPath = existingProfile.role === 'dealer' ? '/dealer/onboarding' : '/buyer/requests';
      return { success: true, redirectTo: redirectPath };
    }

    // 5. Update or create user profile with selected role
    if (existingProfile) {
      // Update existing profile (this ensures updatedAt > createdAt)
      await db
        .update(userProfiles)
        .set({
          role,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, user.id));
    } else {
      // Create new profile - let database set createdAt, then immediately update
      // This ensures updatedAt is after createdAt
      await db.insert(userProfiles).values({
        userId: user.id,
        role,
        // Let database defaults handle timestamps initially
      });

      // Immediately update to ensure updatedAt is different from createdAt
      await db
        .update(userProfiles)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, user.id));
    }

    // 6. Verify the role was actually saved
    const [verifiedProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id));

    if (!verifiedProfile || verifiedProfile.role !== role) {
      return { success: false, error: 'Failed to save role. Please try again.' };
    }

    // 7. Revalidate paths
    revalidatePath('/buyer');
    revalidatePath('/dealer');
    revalidatePath('/');
    revalidatePath('/buyer/requests');
    revalidatePath('/dealer/onboarding');

    // 8. Determine redirect based on role
    const redirectTo = role === 'dealer' ? '/dealer/onboarding' : '/buyer/requests';

    return { success: true, redirectTo };
  } catch (error) {
    console.error('Failed to select role:', error);
    return { success: false, error: 'Kunne ikke lagre rolle. Prøv igjen.' };
  }
}
