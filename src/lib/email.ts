import { Resend } from 'resend';

import { stackServerApp } from '@/stack/server';

const resendApiKey = process.env.RESEND_API_KEY ?? process.env.resend_api_key;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL ??
  process.env.resend_from_email ??
  'AutoAnbud <noreply@autoanbud.com>';

const resend = resendApiKey
  ? new Resend(resendApiKey)
  : null;

export async function getUserEmail(userId: string) {
  const user = await stackServerApp.getUser(userId);

  return user?.primaryEmail ?? null;
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string,
) {
  if (!resend) {
    console.warn('Resend API key is not configured, skipping email send.');
    return;
  }

  try {
    await resend.emails.send({
      from: resendFromEmail,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send failed:', error);
  }
}

export async function sendNewOfferEmail(
  recipientEmail: string,
  recipientName: string,
  requestTitle: string,
  link: string,
) {
  const html = `
    <h1>Du har mottatt et nytt tilbud</h1>
    <p>Hei ${recipientName},</p>
    <p>En forhandler har sendt et nytt tilbud for forespørselen din:</p>
    <p><strong>${requestTitle}</strong></p>
    <p>
      <a href="${link}">Se tilbudet her</a>
    </p>
  `;

  await sendEmailNotification(recipientEmail, 'Nytt tilbud på din forespørsel', html);
}

export async function sendNewMessageEmail(
  recipientEmail: string,
  senderName: string,
  requestTitle: string,
  link: string,
) {
  const html = `
    <h1>Ny melding på tilbudet ditt</h1>
    <p>Hei,</p>
    <p>${senderName} har sendt deg en ny melding i samtalen for forespørselen:</p>
    <p><strong>${requestTitle}</strong></p>
    <p>
      <a href="${link}">Gå til samtalen</a>
    </p>
  `;

  await sendEmailNotification(recipientEmail, 'Ny melding på tilbudet ditt', html);
}

export async function sendNotificationEmail(options: {
  userId: string;
  subject: string;
  html: string;
}) {
  const email = await getUserEmail(options.userId);
  if (!email) return;

  await sendEmailNotification(email, options.subject, options.html);
}
