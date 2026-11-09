import { type Context, Hono } from 'hono';
import type { AppEnv } from '../env';
import { ContentRepository } from './content.repository';

/**
 * Public, read-only content endpoints (see API.md).
 * Responses may be cached briefly; the ETag middleware turns repeat requests into 304s.
 * (Caching is set per response: a `.use()` here would apply to every route under /api/v1.)
 */
export const contentRoutes = new Hono<AppEnv>()
  .get('/portfolio', async (c) => cached(c, await repo(c).portfolio()))
  .get('/projects', async (c) => cached(c, await repo(c).projects()))
  .get('/skills', async (c) => cached(c, await repo(c).skills()))
  .get('/experience', async (c) => cached(c, { roles: await repo(c).roles() }));

const repo = (c: Context<AppEnv>) => new ContentRepository(c.env.DB);

function cached(c: Context<AppEnv>, body: object): Response {
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
  return c.json(body);
}
