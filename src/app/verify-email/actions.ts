'use server';

import { revalidatePath } from 'next/cache';

import { sendPrimaryEmailVerification } from '@/lib/auth/emailVerification';
import { stackServerApp } from '@/stack/server';

export async function resendVerificationEmailAction() {
  const user = await stackServerApp.getUser();

  if (!user) {
    return { success: false as const, error: 'Du må være innlogget.' };
  }

  try {
    const result = await sendPrimaryEmailVerification(user);
    revalidatePath('/verify-email');

    if (!result.sent && result.reason === 'already_verified') {
      return {
        success: true as const,
        message: 'E-posten er allerede bekreftet.',
      };
    }

    if (!result.sent) {
      return {
        success: false as const,
        error: 'Fant ikke en primær e-postadresse å bekrefte.',
      };
    }

    return {
      success: true as const,
      message: 'Ny bekreftelseslenke er sendt.',
    };
  } catch (error) {
    console.error('Failed to send verification email', error);
    return {
      success: false as const,
      error: 'Kunne ikke sende bekreftelseslenke. Prøv igjen.',
    };
  }
}
