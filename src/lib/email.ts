import { Resend } from 'resend';
import { eq } from 'drizzle-orm';

import { db, usersSync } from '@/db';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function getUserEmail(userId: string) {
  const [row] = await db
    .select({ email: usersSync.email })
    .from(usersSync)
    .where(eq(usersSync.id, userId));

  return row?.email ?? null;
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
      from: 'noreply@autoanbud.com',
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