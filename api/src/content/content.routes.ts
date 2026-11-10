import { type Context, Hono } from 'hono';
import type { AppEnv } from '../env';
import { imageUrl } from '../images/images';
import { ContentRepository } from './content.repository';

/**
 * Public, read-only content endpoints (see API.md).
 * `no-cache`: browsers revalidate on every load, so admin edits show up immediately; the ETag
 * middleware answers unchanged content with a tiny 304.
 * (Caching is set per response: a `.use()` here would apply to every route under /api/v1.)
 */
export const contentRoutes = new Hono<AppEnv>()
  .get('/portfolio', async (c) => cached(c, await repo(c).portfolio()))
  .get('/projects', async (c) => cached(c, await repo(c).projects()))
  .get('/skills', async (c) => cached(c, await repo(c).skills()))
  .get('/experience', async (c) => cached(c, { roles: await repo(c).roles() }));

const repo = (c: Context<AppEnv>) =>
  new ContentRepository(c.env.DB, (key) => imageUrl(c.req.url, key));

function cached(c: Context<AppEnv>, body: object): Response {
  c.header('Cache-Control', 'public, no-cache');
  return c.json(body);
}
