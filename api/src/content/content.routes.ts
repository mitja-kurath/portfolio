import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { ContentRepository } from './content.repository';

/**
 * Public, read-only content endpoints (see API.md).
 * Responses may be cached briefly; the ETag middleware turns repeat requests into 304s.
 */
export const contentRoutes = new Hono<AppEnv>()
  .use(async (c, next) => {
    await next();
    if (c.res.ok) {
      c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
    }
  })
  .get('/portfolio', async (c) => c.json(await repo(c.env.DB).portfolio()))
  .get('/projects', async (c) => c.json(await repo(c.env.DB).projects()))
  .get('/skills', async (c) => c.json(await repo(c.env.DB).skills()))
  .get('/experience', async (c) => c.json({ roles: await repo(c.env.DB).roles() }));

const repo = (db: D1Database) => new ContentRepository(db);
