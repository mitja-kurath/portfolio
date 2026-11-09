import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import type { Bindings } from '../src/env';
import { createTestD1 } from './sqlite-d1';

const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Let’s build something together.',
  turnstileToken: 'token-ok',
};

interface Setup {
  turnstilePasses?: boolean;
  limiterAllows?: boolean;
  env?: Partial<Bindings>;
}

function setup({ turnstilePasses = true, limiterAllows = true, env = {} }: Setup = {}) {
  const { d1, db } = createTestD1();
  const background: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => background.push(p),
    passThroughOnException: () => undefined,
    props: {},
  } as unknown as ExecutionContext;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url.includes('turnstile')) return Response.json({ success: turnstilePasses });
    if (url.includes('resend')) return Response.json({ id: 'email-1' });
    throw new Error(`Unexpected fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);

  const bindings: Bindings = {
    DB: d1,
    ALLOWED_ORIGINS: 'http://localhost:4200',
    TURNSTILE_SECRET_KEY: 'secret',
    CONTACT_LIMITER: { limit: async () => ({ success: limiterAllows }) } as unknown as RateLimit,
    ...env,
  };
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    app.request(
      '/api/v1/contact-messages',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      },
      bindings,
      ctx,
    );
  const stored = () => db.prepare('SELECT name, email, message FROM contact_messages').all();
  return { post, stored, fetchMock, background };
}

describe('POST /contact-messages', () => {
  beforeEach(() => vi.spyOn(console, 'log').mockImplementation(() => undefined));
  afterEach(() => vi.unstubAllGlobals());

  it('stores a valid message and answers 201 with id and time', async () => {
    const { post, stored, fetchMock } = setup();
    const res = await post(VALID);

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; receivedAt: string };
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Date.parse(body.receivedAt)).not.toBeNaN();
    expect(res.headers.get('location')).toBe(`/api/v1/contact-messages/${body.id}`);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(stored()).toEqual([
      { name: 'Ada Lovelace', email: 'ada@example.com', message: 'Let’s build something together.' },
    ]);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.get('secret')).toBe('secret');
    expect(form.get('response')).toBe('token-ok');
    expect(form.get('remoteip')).toBe('203.0.113.7');
  });

  it('emails the owner in the background when Resend is configured', async () => {
    const { post, fetchMock, background } = setup({
      env: {
        RESEND_API_KEY: 're_test',
        CONTACT_TO_EMAIL: 'me@example.com',
        CONTACT_FROM_EMAIL: 'Portfolio <contact@example.com>',
      },
    });
    await post(VALID);
    await Promise.all(background);

    const resend = fetchMock.mock.calls.find(([url]) => String(url).includes('resend'));
    expect(resend).toBeDefined();
    const init = resend![1]!;
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer re_test');
    expect(JSON.parse(init.body as string)).toMatchObject({
      to: ['me@example.com'],
      reply_to: 'ada@example.com',
      subject: 'Portfolio: message from Ada Lovelace',
    });
  });

  it('rejects invalid fields with 400 problem+json listing the errors', async () => {
    const { post, stored } = setup();
    const res = await post({ name: ' ', email: 'nope', message: '', turnstileToken: '' });

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(await res.json()).toMatchObject({
      status: 400,
      errors: {
        name: 'Name is required.',
        email: 'A valid email address is required.',
        message: 'Message is required.',
        turnstileToken: 'The spam check is missing.',
      },
    });
    expect(stored()).toEqual([]);
  });

  it('rejects a body that is not JSON', async () => {
    const res = await setup().post('{nope');
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ detail: 'The body must be JSON.' });
  });

  it('rejects oversized bodies with 413', async () => {
    const res = await setup().post({ ...VALID, message: 'x'.repeat(20_000) });
    expect(res.status).toBe(413);
  });

  it('rejects a failed spam check with 403 and stores nothing', async () => {
    const { post, stored } = setup({ turnstilePasses: false });
    const res = await post(VALID);
    expect(res.status).toBe(403);
    expect(stored()).toEqual([]);
  });

  it('answers 429 when the rate limit is reached', async () => {
    const { post, stored } = setup({ limiterAllows: false });
    const res = await post(VALID);
    expect(res.status).toBe(429);
    expect(stored()).toEqual([]);
  });

  it('pretends success for the honeypot but stores nothing', async () => {
    const { post, stored } = setup();
    const res = await post({ ...VALID, website: 'https://spam.example' });
    expect(res.status).toBe(201);
    expect(stored()).toEqual([]);
  });

  it('answers 503 when Turnstile is not configured', async () => {
    const res = await setup({ env: { TURNSTILE_SECRET_KEY: undefined } }).post(VALID);
    expect(res.status).toBe(503);
  });

  it('allows the site origin to post (CORS preflight)', async () => {
    const res = await app.request(
      '/api/v1/contact-messages',
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:4200',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      },
      { ALLOWED_ORIGINS: 'http://localhost:4200' },
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:4200');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
  });
});
