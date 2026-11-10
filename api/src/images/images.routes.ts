import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { problem } from '../problem';
import { IMAGE_KEY, contentTypeForKey } from './images';

/** Public `GET /images/:key`: serves uploaded images from R2. Keys never change → cache forever. */
export const imagesRoutes = new Hono<AppEnv>().get('/images/:key', async (c) => {
  const key = c.req.param('key');
  if (!IMAGE_KEY.test(key)) return problem(c, 404, 'Not Found', 'No such image.');

  const object = await c.env.IMAGES.get(key);
  if (!object) return problem(c, 404, 'Not Found', 'No such image.');

  return c.body(object.body, 200, {
    'Content-Type': object.httpMetadata?.contentType ?? contentTypeForKey(key),
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: object.httpEtag,
    'X-Content-Type-Options': 'nosniff',
  });
});
