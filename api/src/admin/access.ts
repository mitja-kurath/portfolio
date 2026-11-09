import type { MiddlewareHandler } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AdminEnv, Bindings } from '../env';
import { problem } from '../problem';

const jwksByTeam = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(teamDomain: string) {
  let set = jwksByTeam.get(teamDomain);
  if (!set) {
    set = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', teamDomain));
    jwksByTeam.set(teamDomain, set);
  }
  return set;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Returns the signed-in admin's email, or null.
 *
 * Production: Cloudflare Access sits in front of /api/v1/admin and adds a signed JWT
 * (`Cf-Access-Jwt-Assertion`). It is verified against the team's public keys, issuer and the
 * application's AUD tag; ADMIN_EMAILS can restrict it further.
 *
 * Local development: ADMIN_DEV_BYPASS=true (api/.dev.vars) signs you in as `dev@localhost`,
 * but only for requests to localhost.
 */
export async function authenticate(request: Request, env: Bindings): Promise<string | null> {
  if (env.ADMIN_DEV_BYPASS === 'true' && LOCAL_HOSTS.has(new URL(request.url).hostname)) {
    return 'dev@localhost';
  }

  const team = env.ACCESS_TEAM_DOMAIN?.replace(/\/+$/, '');
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!team || !env.ACCESS_AUD || !token) return null;

  try {
    const { payload } = await jwtVerify(token, jwks(team), {
      issuer: team,
      audience: env.ACCESS_AUD,
    });
    const email = typeof payload['email'] === 'string' ? payload['email'].toLowerCase() : null;
    if (!email) return null;
    const allowed = (env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    return allowed.length === 0 || allowed.includes(email) ? email : null;
  } catch {
    return null;
  }
}

/** Rejects requests without a valid admin session (401 problem+json). */
export const requireAdmin: MiddlewareHandler<AdminEnv> = async (c, next) => {
  const email = await authenticate(c.req.raw, c.env);
  if (!email) {
    return problem(c, 401, 'Unauthorized', 'Sign in through Cloudflare Access to use the admin API.');
  }
  c.set('adminEmail', email);
  await next();
  c.header('Cache-Control', 'no-store');
  return undefined;
};
