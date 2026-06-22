import type { CurrentServerUser } from '@stackframe/stack';

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function isEmailVerificationRequired(user: CurrentServerUser) {
  return !!user.primaryEmail && !user.primaryEmailVerified;
}

export async function sendPrimaryEmailVerification(user: CurrentServerUser) {
  if (!isEmailVerificationRequired(user)) {
    return { sent: false, reason: 'already_verified' as const };
  }

  const channels = await user.listContactChannels();
  const primaryEmailChannel = channels.find(
    (channel) =>
      channel.type === 'email' &&
      channel.value === user.primaryEmail &&
      channel.isPrimary,
  );

  if (!primaryEmailChannel) {
    return { sent: false, reason: 'missing_primary_email_channel' as const };
  }

  await primaryEmailChannel.sendVerificationEmail({
    callbackUrl: `${getAppUrl()}/handler/email-verification`,
  });

  return { sent: true as const };
}
