import { describe, expect, it } from 'vitest';
import { MOCK_PORTFOLIO } from '../../src/app/core/mock/mock-data';
import { buildSeedSql } from '../scripts/seed-sql.mjs';
import { app } from '../src/app';
import type { Bindings } from '../src/env';
import { MemoryR2 } from './memory-r2';
import { createTestD1 } from './sqlite-d1';

const ORIGIN = 'http://localhost:4200';

function setup(seed = true) {
  const { d1, db } = createTestD1(...(seed ? [buildSeedSql(MOCK_PORTFOLIO)] : []));
  const env: Bindings = {
    DB: d1,
    IMAGES: new MemoryR2().asBinding(),
    ALLOWED_ORIGINS: `${ORIGIN}, https://mitjakurath.ch`,
  };
  const get = (path: string, headers: Record<string, string> = {}) =>
    app.request(`/api/v1${path}`, { headers }, env);
  return { get, db, env };
}

describe('content API', () => {
  it('serves the seeded portfolio exactly like the frontend mock', async () => {
    const res = await setup().get('/portfolio');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toBe('public, no-cache');
    expect(await res.json()).toEqual(MOCK_PORTFOLIO);
  });

  it('serves the single resources', async () => {
    const { get } = setup();
    expect(await (await get('/projects')).json()).toEqual(MOCK_PORTFOLIO.projects);
    expect(await (await get('/skills')).json()).toEqual(MOCK_PORTFOLIO.skills);
    expect(await (await get('/experience')).json()).toEqual(MOCK_PORTFOLIO.experience);
  });

  it('orders projects by sort order and hides unpublished ones', async () => {
    const { get, db } = setup();
    db.exec(`UPDATE projects SET sort_order = 0 WHERE id = '${MOCK_PORTFOLIO.projects[3].id}'`);
    db.exec(`UPDATE projects SET published = 0 WHERE id = '${MOCK_PORTFOLIO.projects[0].id}'`);
    const ids = ((await (await get('/projects')).json()) as { id: string }[]).map((p) => p.id);
    expect(ids).toEqual([3, 1, 2].map((i) => MOCK_PORTFOLIO.projects[i].id));
  });

  it('answers repeat requests with 304 via ETag', async () => {
    const { get } = setup();
    const first = await get('/projects');
    const etag = first.headers.get('etag');
    expect(etag).toBeTruthy();
    expect((await get('/projects', { 'If-None-Match': etag! })).status).toBe(304);
  });

  it('allows configured origins only (CORS)', async () => {
    const { get } = setup();
    expect((await get('/skills', { Origin: ORIGIN })).headers.get('access-control-allow-origin')).toBe(
      ORIGIN,
    );
    expect(
      (await get('/skills', { Origin: 'https://evil.example' })).headers.get(
        'access-control-allow-origin',
      ),
    ).toBeNull();
  });

  it('returns problem+json for unknown endpoints', async () => {
    const res = await setup().get('/nope', { Origin: ORIGIN });
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(await res.json()).toMatchObject({ status: 404, title: 'Not Found', instance: '/api/v1/nope' });
  });

  it('serves empty lists before anything is added', async () => {
    const res = await setup(false).get('/portfolio');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      profile: { portraitUrl: null },
      projects: [],
      skills: [],
      experience: { roles: [] },
    });
  });

  it('returns 500 problem+json without leaking details when the database fails', async () => {
    const { get, db } = setup();
    db.exec('DROP TABLE roles');
    const res = await get('/experience');
    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      instance: '/api/v1/experience',
    });
  });
});
