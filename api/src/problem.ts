import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** RFC 7807 problem details (same shape the frontend's `ProblemDetails` reads). */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

/** RFC 7807 error response, the format the frontend's `toApiError` parses. */
export function problem(
  c: Context,
  status: ContentfulStatusCode,
  title: string,
  detail?: string,
): Response {
  const body: ProblemDetails = {
    type: 'about:blank',
    title,
    status,
    ...(detail ? { detail } : {}),
    instance: c.req.path,
  };
  return c.body(JSON.stringify(body), status, {
    'Content-Type': 'application/problem+json',
    'Cache-Control': 'no-store',
  });
}

/** Thrown by data access code; mapped to a problem response by the error handler. */
export class ProblemError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly title: string,
    readonly detail?: string,
  ) {
    super(detail ?? title);
  }
}

/** Parses the JSON body or throws a 400 problem. */
export async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ProblemError(400, 'Bad Request', 'The body must be JSON.');
  }
}

/** 400 problem+json with an `errors` map (field → message). */
export function invalid(c: Context, errors: Record<string, string>): Response {
  return c.body(
    JSON.stringify({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Some fields are missing or invalid.',
      instance: c.req.path,
      errors,
    }),
    400,
    { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store' },
  );
}
