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
