import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOfferNotification(email: string, offerDetails: any) {
  try {
    await resend.emails.send({
      from: 'noreply@autoanbud.com',
      to: email,
      subject: 'New offer on your car request',
      html: `
        <h1>You have a new offer!</h1>
        <p>Details: ${JSON.stringify(offerDetails)}</p>
      `,
    });
  } catch (error) {
    console.error('Email send failed:', error);
  }
}