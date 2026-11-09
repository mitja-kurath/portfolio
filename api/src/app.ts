import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { etag } from 'hono/etag';
import { contactRoutes } from './contact/contact.routes';
import { contentRoutes } from './content/content.routes';
import type { AppEnv } from './env';
import { ProblemError, problem } from './problem';

export const app = new Hono<AppEnv>().basePath('/api/v1');

app.use(
  cors({
    origin: (origin, c) => (allowedOrigins(c.env.ALLOWED_ORIGINS).includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
    maxAge: 86400,
  }),
);
app.use(etag());

app.route('/', contentRoutes);
app.route('/', contactRoutes);

app.notFound((c) => problem(c, 404, 'Not Found', `No endpoint at ${c.req.method} ${c.req.path}.`));

app.onError((err, c) => {
  if (err instanceof ProblemError) return problem(c, err.status, err.title, err.detail);
  console.error(err);
  return problem(c, 500, 'Internal Server Error');
});

function allowedOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
