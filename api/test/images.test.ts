import { type JWK, SignJWT, exportJWK, generateKeyPair } from 'jose';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MOCK_PORTFOLIO } from '../../src/app/core/mock/mock-data';
import { buildSeedSql } from '../scripts/seed-sql.mjs';
import { app } from '../src/app';
import type { Bindings } from '../src/env';
import { MemoryR2 } from './memory-r2';
import { createTestD1 } from './sqlite-d1';

const TEAM = 'https://example-team.cloudflareaccess.com';
const AUD = 'aud';
const ORIGIN = 'https://mitjakurath.ch';

/** Smallest byte sequences that pass the magic-byte checks. */
const WEBP = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBPVP8 '].map((c) => c.charCodeAt(0))));
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

let privateKey: CryptoKey;
let jwk: JWK;
beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256' };
});
afterEach(() => vi.unstubAllGlobals());

async function setup() {
  const { d1 } = createTestD1(buildSeedSql(MOCK_PORTFOLIO));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ keys: [jwk] })),
  );
  const images = new MemoryR2();
  const background: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => background.push(p),
    passThroughOnException: () => undefined,
    props: {},
  } as unknown as ExecutionContext;
  const env: Bindings = {
    DB: d1,
    IMAGES: images.asBinding(),
    ALLOWED_ORIGINS: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
  };
  const jwt = await new SignJWT({ email: 'me@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(TEAM)
    .setAudience(AUD)
    .setExpirationTime('5m')
    .sign(privateKey);

  const request = (path: string, init: RequestInit = {}, signedIn = true) =>
    app.request(
      `${ORIGIN}/api/v1${path}`,
      {
        ...init,
        headers: { ...(signedIn ? { 'Cf-Access-Jwt-Assertion': jwt } : {}), ...(init.headers ?? {}) },
      },
      env,
      ctx,
    );
  const upload = async (bytes: Uint8Array, type: string) =>
    request('/admin/images', { method: 'POST', headers: { 'Content-Type': type }, body: bytes });
  const json = (method: string, path: string, body: unknown) =>
    request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const settle = () => Promise.all(background);
  return { request, upload, json, settle, images };
}

const projectBody = (imageKey: string | null) => {
  const { id: _, order: __, ...rest } = MOCK_PORTFOLIO.projects[0];
  return { ...rest, published: true, imageKey };
};

describe('image uploads', () => {
  it('requires an admin session', async () => {
    const { request } = await setup();
    const res = await request('/admin/images', { method: 'POST', body: WEBP }, false);
    expect(res.status).toBe(401);
  });

  it('stores a valid image and serves it publicly with long caching', async () => {
    const { upload, request, images } = await setup();
    const res = await upload(WEBP, 'image/webp');
    expect(res.status).toBe(201);
    const { key, url } = (await res.json()) as { key: string; url: string };
    expect(key).toMatch(/^[0-9a-f-]{36}\.webp$/);
    expect(url).toBe(`${ORIGIN}/api/v1/images/${key}`);
    expect(images.objects.has(key)).toBe(true);

    const served = await request(`/images/${key}`, {}, false);
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/webp');
    expect(served.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(new Uint8Array(await served.arrayBuffer())).toEqual(WEBP);
  });

  it('rejects files whose bytes do not match the declared type', async () => {
    const { upload } = await setup();
    expect((await upload(PNG, 'image/webp')).status).toBe(415);
    expect((await upload(new TextEncoder().encode('<svg/>'), 'image/svg+xml')).status).toBe(415);
  });

  it('rejects images over 5 MB', async () => {
    const { upload } = await setup();
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(PNG);
    expect((await upload(big, 'image/png')).status).toBe(413);
  });

  it('answers 404 for unknown or malformed image keys', async () => {
    const { request } = await setup();
    expect((await request('/images/00000000-0000-0000-0000-000000000000.webp', {}, false)).status).toBe(404);
    expect((await request('/images/..%2Fsecret', {}, false)).status).toBe(404);
  });
});

describe('project banner images', () => {
  it('sets an image, exposes its URL publicly and deletes it when replaced', async () => {
    const { upload, json, request, settle, images } = await setup();
    const first = ((await (await upload(WEBP, 'image/webp')).json()) as { key: string }).key;
    const second = ((await (await upload(PNG, 'image/png')).json()) as { key: string }).key;

    const res = await json('PUT', '/admin/projects/marsch', projectBody(first));
    expect(await res.json()).toMatchObject({ imageKey: first, imageUrl: `${ORIGIN}/api/v1/images/${first}` });

    const pub = (await (await request('/projects', {}, false)).json()) as { id: string; imageUrl?: string }[];
    expect(pub.find((p) => p.id === 'marsch')?.imageUrl).toBe(`${ORIGIN}/api/v1/images/${first}`);

    await json('PUT', '/admin/projects/marsch', projectBody(second));
    await settle();
    expect(images.objects.has(first)).toBe(false);
    expect(images.objects.has(second)).toBe(true);

    await request('/admin/projects/marsch', { method: 'DELETE' });
    await settle();
    expect(images.objects.has(second)).toBe(false);
  });

  it('rejects keys that are not uploaded-image keys', async () => {
    const { json } = await setup();
    const res = await json('PUT', '/admin/projects/marsch', projectBody('../../etc/passwd'));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { errors: object }).errors).toEqual({
      imageKey: 'Not a valid uploaded image.',
    });
  });
});

describe('portrait', () => {
  it('sets, replaces and removes the portrait', async () => {
    const { upload, json, request, settle, images } = await setup();
    expect(await (await request('/admin/profile')).json()).toEqual({ portraitKey: null, portraitUrl: null });

    const first = ((await (await upload(WEBP, 'image/webp')).json()) as { key: string }).key;
    const set = await json('PUT', '/admin/profile', { portraitKey: first });
    expect(await set.json()).toEqual({ portraitKey: first, portraitUrl: `${ORIGIN}/api/v1/images/${first}` });

    const portfolio = (await (await request('/portfolio', {}, false)).json()) as { profile: object };
    expect(portfolio.profile).toEqual({ portraitUrl: `${ORIGIN}/api/v1/images/${first}` });

    const second = ((await (await upload(PNG, 'image/png')).json()) as { key: string }).key;
    await json('PUT', '/admin/profile', { portraitKey: second });
    await settle();
    expect(images.objects.has(first)).toBe(false);

    await json('PUT', '/admin/profile', { portraitKey: null });
    await settle();
    expect(images.objects.has(second)).toBe(false);
    expect(await (await request('/admin/profile')).json()).toEqual({ portraitKey: null, portraitUrl: null });
  });

  it('rejects invalid portrait keys', async () => {
    const { json } = await setup();
    expect((await json('PUT', '/admin/profile', { portraitKey: 'nope.exe' })).status).toBe(400);
  });
});
