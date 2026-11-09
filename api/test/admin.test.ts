import { type JWK, SignJWT, exportJWK, generateKeyPair } from 'jose';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MOCK_PORTFOLIO } from '../../src/app/core/mock/mock-data';
import { buildSeedSql } from '../scripts/seed-sql.mjs';
import { app } from '../src/app';
import type { Bindings } from '../src/env';
import { createTestD1, wrapD1 } from './sqlite-d1';

const TEAM = 'https://example-team.cloudflareaccess.com';
const AUD = 'aud-tag-123';
let privateKey: CryptoKey;
let jwk: JWK;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256' };
});

afterEach(() => vi.unstubAllGlobals());

function token(claims: { email?: string; aud?: string; iss?: string; key?: CryptoKey } = {}) {
  return new SignJWT({ email: claims.email ?? 'me@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(claims.iss ?? TEAM)
    .setAudience(claims.aud ?? AUD)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(claims.key ?? privateKey);
}

function setup(env: Partial<Bindings> = {}, origin = 'https://kurath.dev') {
  const { d1, db } = createTestD1(buildSeedSql(MOCK_PORTFOLIO));
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === `${TEAM}/cdn-cgi/access/certs`) return Response.json({ keys: [jwk] });
    if (url.startsWith('https://api.cloudflare.com/client/v4/pages/webhooks')) {
      return Response.json({ success: true });
    }
    throw new Error(`Unexpected fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);

  const bindings: Bindings = {
    DB: d1,
    ALLOWED_ORIGINS: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ...env,
  };
  let jwt: string | null = null;
  const call = async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
    app.request(
      `${origin}/api/v1/admin${path}`,
      {
        method,
        headers: {
          ...(jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {}),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      bindings,
    );
  const signIn = async (claims?: Parameters<typeof token>[0]) => {
    jwt = await token(claims);
  };
  return { call, signIn, db, fetchMock };
}

describe('admin authentication', () => {
  it('rejects requests without an Access token', async () => {
    const res = await setup().call('GET', '/session');
    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
  });

  it('accepts a valid Access token and returns the session', async () => {
    const { call, signIn } = setup();
    await signIn({ email: 'Me@Example.com' });
    const res = await call('GET', '/session');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ email: 'me@example.com', canRebuild: false });
  });

  it.each([
    ['wrong audience', { aud: 'other-app' }],
    ['wrong issuer', { iss: 'https://evil.cloudflareaccess.com' }],
  ])('rejects a token with the %s', async (_, claims) => {
    const { call, signIn } = setup();
    await signIn(claims);
    expect((await call('GET', '/session')).status).toBe(401);
  });

  it('rejects a token signed with another key', async () => {
    const { call, signIn } = setup();
    await signIn({ key: (await generateKeyPair('RS256')).privateKey });
    expect((await call('GET', '/session')).status).toBe(401);
  });

  it('enforces ADMIN_EMAILS when set', async () => {
    const { call, signIn } = setup({ ADMIN_EMAILS: 'boss@example.com' });
    await signIn({ email: 'me@example.com' });
    expect((await call('GET', '/session')).status).toBe(401);
  });

  it('denies everything when Access is not configured', async () => {
    const { call, signIn } = setup({ ACCESS_TEAM_DOMAIN: undefined, ACCESS_AUD: undefined });
    await signIn();
    expect((await call('GET', '/session')).status).toBe(401);
  });

  it('allows the dev bypass only on localhost', async () => {
    const remote = setup({ ADMIN_DEV_BYPASS: 'true' });
    expect((await remote.call('GET', '/session')).status).toBe(401);

    const local = setup({ ADMIN_DEV_BYPASS: 'true' }, 'http://localhost:8080');
    const res = await local.call('GET', '/session');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ email: 'dev@localhost' });
  });
});

describe('admin projects', () => {
  const NEW_PROJECT = {
    id: 'trail-log',
    name: 'Trail Log',
    type: 'Field notes',
    year: '2026',
    stack: 'Angular / Workers',
    description: 'A log for every route.',
    artVariant: 2,
    coordinates: ['N 46.0°', 'E 7.0°'],
    url: 'https://example.com/trail-log',
    published: false,
  };

  it('lists every project including drafts, with the published flag', async () => {
    const { call, signIn, db } = setup();
    await signIn();
    db.exec("UPDATE projects SET published = 0 WHERE id = 'koda'");
    const projects = (await (await call('GET', '/projects')).json()) as { id: string; published: boolean }[];
    expect(projects.map((p) => [p.id, p.published])).toEqual([
      ['marsch', true],
      ['koda', false],
      ['markdown2pdf', true],
      ['vst3-template', true],
    ]);
  });

  it('creates a project at the end of the list', async () => {
    const { call, signIn } = setup();
    await signIn();
    const res = await call('POST', '/projects', NEW_PROJECT);
    expect(res.status).toBe(201);
    expect(res.headers.get('location')).toBe('/api/v1/admin/projects/trail-log');
    expect(await res.json()).toEqual({ ...NEW_PROJECT, order: 5 });
  });

  it('hides drafts from the public API', async () => {
    const { call, signIn, db } = setup();
    await signIn();
    await call('POST', '/projects', NEW_PROJECT);
    const env = { DB: wrapD1(db), ALLOWED_ORIGINS: '' };
    const ids = ((await (await app.request('/api/v1/projects', {}, env)).json()) as { id: string }[]).map((p) => p.id);
    expect(ids).not.toContain('trail-log');

    await call('PUT', '/projects/trail-log', { ...withoutId(NEW_PROJECT), published: true });
    const after = ((await (await app.request('/api/v1/projects', {}, env)).json()) as { id: string }[]).map((p) => p.id);
    expect(after).toContain('trail-log');
  });

  it('validates input and reports field errors', async () => {
    const { call, signIn } = setup();
    await signIn();
    const res = await call('POST', '/projects', {
      ...NEW_PROJECT,
      id: 'Not A Slug',
      name: '',
      artVariant: 7,
      url: 'javascript:alert(1)',
      published: 'yes',
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { errors: object }).errors).toEqual({
      id: 'Use lowercase letters, digits and dashes (e.g. my-project).',
      name: 'Required.',
      artVariant: 'Must be a whole number from 1 to 4.',
      url: 'Must be an http(s) URL.',
      published: 'Must be true or false.',
    });
  });

  it('rejects duplicate ids with 409', async () => {
    const { call, signIn } = setup();
    await signIn();
    const res = await call('POST', '/projects', { ...NEW_PROJECT, id: 'koda' });
    expect(res.status).toBe(409);
  });

  it('updates a project and keeps its id and order', async () => {
    const { call, signIn } = setup();
    await signIn();
    const res = await call('PUT', '/projects/koda', { ...withoutId(NEW_PROJECT), name: 'Koda 2' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'koda', order: 2, name: 'Koda 2', published: false });
  });

  it('answers 404 for unknown ids', async () => {
    const { call, signIn } = setup();
    await signIn();
    expect((await call('PUT', '/projects/nope', withoutId(NEW_PROJECT))).status).toBe(404);
    expect((await call('DELETE', '/projects/nope')).status).toBe(404);
  });

  it('reorders with the full list of ids only', async () => {
    const { call, signIn } = setup();
    await signIn();
    const order = ['vst3-template', 'marsch', 'koda', 'markdown2pdf'];
    const res = await call('PUT', '/projects/order', { ids: order });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { id: string; order: number }[]).map((p) => `${p.order}:${p.id}`)).toEqual([
      '1:vst3-template',
      '2:marsch',
      '3:koda',
      '4:markdown2pdf',
    ]);
    expect((await call('PUT', '/projects/order', { ids: order.slice(1) })).status).toBe(400);
    expect((await call('PUT', '/projects/order', { ids: [...order.slice(1), 'koda'] })).status).toBe(400);
  });

  it('deletes a project', async () => {
    const { call, signIn } = setup();
    await signIn();
    expect((await call('DELETE', '/projects/markdown2pdf')).status).toBe(204);
    const ids = ((await (await call('GET', '/projects')).json()) as { id: string }[]).map((p) => p.id);
    expect(ids).toEqual(['marsch', 'koda', 'vst3-template']);
  });
});

describe('admin skill groups and roles', () => {
  it('creates and edits a skill group', async () => {
    const { call, signIn } = setup();
    await signIn();
    const created = await call('POST', '/skill-groups', { id: 'cloud', title: 'Cloud', items: ['Workers', ' D1 ', ''] });
    expect(await created.json()).toEqual({ id: 'cloud', order: 4, title: 'Cloud', items: ['Workers', 'D1'] });
    const empty = await call('PUT', '/skill-groups/cloud', { title: 'Cloud', items: [] });
    expect(((await empty.json()) as { errors: object }).errors).toEqual({ items: 'At least 1 required.' });
  });

  it('updates a role', async () => {
    const { call, signIn } = setup();
    await signIn();
    const res = await call('PUT', '/roles/kyberna', {
      year: '2026',
      title: 'Founder',
      subtitle: 'New summit',
      isCurrent: true,
    });
    expect(await res.json()).toEqual({
      id: 'kyberna',
      order: 3,
      year: '2026',
      title: 'Founder',
      subtitle: 'New summit',
      isCurrent: true,
    });
  });
});

describe('admin messages and rebuild', () => {
  it('lists, marks and deletes contact messages', async () => {
    const { call, signIn, db } = setup();
    await signIn();
    db.exec(`INSERT INTO contact_messages (id, name, email, message, created_at) VALUES
      ('m1', 'Ada', 'ada@example.com', 'First', '2026-11-01T10:00:00.000Z'),
      ('m2', 'Bob', 'bob@example.com', 'Second', '2026-11-02T10:00:00.000Z')`);

    const list = (await (await call('GET', '/messages')).json()) as { id: string; readAt: string | null }[];
    expect(list.map((m) => m.id)).toEqual(['m2', 'm1']);
    expect(list[0].readAt).toBeNull();

    const read = (await (await call('PATCH', '/messages/m1', { read: true })).json()) as { readAt: string };
    expect(Date.parse(read.readAt)).not.toBeNaN();
    const unread = (await (await call('PATCH', '/messages/m1', { read: false })).json()) as { readAt: null };
    expect(unread.readAt).toBeNull();

    expect((await call('DELETE', '/messages/m2')).status).toBe(204);
    expect((await call('DELETE', '/messages/m2')).status).toBe(404);
  });

  it('triggers the Pages deploy hook when configured', async () => {
    const hook = 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abc';
    const { call, signIn, fetchMock } = setup({ DEPLOY_HOOK_URL: hook });
    await signIn();
    expect(await (await call('GET', '/session')).json()).toMatchObject({ canRebuild: true });
    expect((await call('POST', '/rebuild')).status).toBe(202);
    expect(fetchMock).toHaveBeenCalledWith(hook, { method: 'POST' });
  });

  it('answers 501 for rebuild without a deploy hook', async () => {
    const { call, signIn } = setup();
    await signIn();
    expect((await call('POST', '/rebuild')).status).toBe(501);
  });
});

function withoutId<T extends { id: string }>({ id: _, ...rest }: T): Omit<T, 'id'> {
  return rest;
}

