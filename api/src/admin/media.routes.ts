import { type Context, Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { AdminProfileDto, UploadedImageDto } from '../../../src/app/core/api/admin.models';
import type { AdminEnv } from '../env';
import { IMAGE_KEY, MAX_IMAGE_BYTES, detectImage, imageUrl } from '../images/images';
import { invalid, problem, readJson } from '../problem';

const PORTRAIT = 'portraitKey';

async function portraitKey(c: Context<AdminEnv>): Promise<string | null> {
  const row = await c.env.DB.prepare('SELECT value FROM settings WHERE key = ?')
    .bind(PORTRAIT)
    .first<{ value: string }>();
  return row?.value ?? null;
}

function profile(c: Context<AdminEnv>, key: string | null): AdminProfileDto {
  return { portraitKey: key, portraitUrl: key ? imageUrl(c.req.url, key) : null };
}

/**
 * POST /images: raw image body (webp, jpeg, png, avif; max. 5 MB) → `{ key, url }`.
 * GET / PUT /profile: the portrait image (`{ portraitKey }`, null removes it).
 */
export const mediaRoutes = new Hono<AdminEnv>()
  .post(
    '/images',
    bodyLimit({
      maxSize: MAX_IMAGE_BYTES,
      onError: (c) => problem(c, 413, 'Payload Too Large', 'Images can be at most 5 MB.'),
    }),
    async (c) => {
      const bytes = new Uint8Array(await c.req.arrayBuffer());
      const ext = detectImage(c.req.header('Content-Type'), bytes);
      if (!ext) {
        return problem(c, 415, 'Unsupported Media Type', 'Upload a WebP, JPEG, PNG or AVIF image.');
      }
      const key = `${crypto.randomUUID()}.${ext}`;
      await c.env.IMAGES.put(key, bytes, {
        httpMetadata: {
          contentType: c.req.header('Content-Type'),
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      const body: UploadedImageDto = { key, url: imageUrl(c.req.url, key) };
      return c.json(body, 201);
    },
  )

  .get('/profile', async (c) => c.json(profile(c, await portraitKey(c))))

  .put('/profile', async (c) => {
    const body = (await readJson(c)) as { portraitKey?: unknown };
    const next = body.portraitKey ?? null;
    if (next !== null && (typeof next !== 'string' || !IMAGE_KEY.test(next))) {
      return invalid(c, { portraitKey: 'Not a valid uploaded image.' });
    }
    const previous = await portraitKey(c);
    if (next === null) {
      await c.env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(PORTRAIT).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      )
        .bind(PORTRAIT, next)
        .run();
    }
    if (previous && previous !== next) c.executionCtx.waitUntil(c.env.IMAGES.delete(previous));
    return c.json(profile(c, next));
  });
