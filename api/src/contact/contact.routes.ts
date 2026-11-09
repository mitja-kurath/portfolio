import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { ContactMessageResponse } from '../../../src/app/core/api/api.models';
import type { AppEnv } from '../env';
import { ProblemError, invalid, problem, readJson } from '../problem';
import { validateContactMessage } from './contact.validation';
import { notifyOwner } from './notify';
import { verifyTurnstile } from './turnstile';

/** `POST /contact-messages`: validate, check for spam, store, then email the owner. */
export const contactRoutes = new Hono<AppEnv>().post(
  '/contact-messages',
  bodyLimit({
    maxSize: 16 * 1024,
    onError: (c) => problem(c, 413, 'Payload Too Large', 'The message is too long.'),
  }),
  async (c) => {
    const ip = c.req.header('CF-Connecting-IP');

    if (c.env.CONTACT_LIMITER) {
      const { success } = await c.env.CONTACT_LIMITER.limit({ key: ip ?? 'unknown' });
      if (!success) {
        return problem(c, 429, 'Too Many Requests', 'Please wait a minute before sending again.');
      }
    }

    const result = validateContactMessage(await readJson(c));
    if (!result.ok) return invalid(c, result.errors);

    const secret = c.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      throw new ProblemError(503, 'Service Unavailable', 'The contact form is not configured.');
    }
    if (!(await verifyTurnstile(result.value.turnstileToken, secret, ip))) {
      return problem(c, 403, 'Forbidden', 'The spam check failed. Please try again.');
    }

    const response: ContactMessageResponse = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
    };
    // Bots that fill the honeypot get the same answer, but nothing is stored or sent.
    if (!result.value.isBot) {
      const { name, email, message } = result.value;
      await c.env.DB.prepare(
        'INSERT INTO contact_messages (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(response.id, name, email, message, response.receivedAt)
        .run();
      c.executionCtx.waitUntil(notifyOwner(c.env, { ...response, name, email, message }));
    }

    c.header('Location', `${c.req.path}/${response.id}`);
    c.header('Cache-Control', 'no-store');
    return c.json(response, 201);
  },
);
