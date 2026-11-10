import { Hono } from 'hono';
import type { AdminSessionDto } from '../../../src/app/core/api/admin.models';
import type { AdminEnv } from '../env';
import { problem } from '../problem';
import { requireAdmin } from './access';
import { collectionRoutes } from './collection.routes';
import { projectsCollection, rolesCollection, skillGroupsCollection } from './collections';
import { mediaRoutes } from './media.routes';
import { messagesRoutes } from './messages.routes';

/** Everything under /api/v1/admin requires a Cloudflare Access session (see access.ts). */
export const adminRoutes = new Hono<AdminEnv>()
  .use(requireAdmin)
  .get('/session', (c) => {
    const session: AdminSessionDto = {
      email: c.get('adminEmail'),
      canRebuild: !!c.env.DEPLOY_HOOK_URL,
    };
    return c.json(session);
  })
  // Rebuilds the pre-rendered site so crawlers see new content (the live page updates anyway).
  .post('/rebuild', async (c) => {
    if (!c.env.DEPLOY_HOOK_URL) {
      return problem(c, 501, 'Not Implemented', 'No Pages deploy hook is configured.');
    }
    const res = await fetch(c.env.DEPLOY_HOOK_URL, { method: 'POST' });
    if (!res.ok) return problem(c, 502, 'Bad Gateway', `The deploy hook answered ${res.status}.`);
    return c.json({ triggered: true }, 202);
  })
  .route('/projects', collectionRoutes(projectsCollection))
  .route('/skill-groups', collectionRoutes(skillGroupsCollection))
  .route('/roles', collectionRoutes(rolesCollection))
  .route('/messages', messagesRoutes)
  .route('/', mediaRoutes);
