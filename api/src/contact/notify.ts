import type { Bindings } from '../env';

export interface StoredMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  receivedAt: string;
}

/**
 * Emails a new contact message to the site owner via Resend (https://resend.com).
 * Without RESEND_API_KEY / CONTACT_TO_EMAIL the message is only stored.
 */
export async function notifyOwner(env: Bindings, msg: StoredMessage): Promise<void> {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.log(`Contact message ${msg.id} stored; email notification not configured.`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: msg.email,
      subject: `Portfolio: message from ${msg.name}`,
      text: `${msg.message}\n\n— ${msg.name} <${msg.email}>\nReceived ${msg.receivedAt} (id ${msg.id})`,
    }),
  });
  if (!res.ok) {
    // The message is already stored, so a failed email is logged, not surfaced to the sender.
    console.error(`Resend failed for ${msg.id}: ${res.status} ${await res.text()}`);
  }
}
