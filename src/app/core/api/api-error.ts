import { HttpErrorResponse } from '@angular/common/http';

/** RFC 7807 problem details as returned by Spring Boot (`application/problem+json`). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

/** Normalised error surfaced by every API call. */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail: string | null = null,
    readonly type = 'about:blank',
    readonly instance: string | null = null,
  ) {
    super(detail ? `${title}: ${detail}` : title);
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('title' in value || 'detail' in value || 'type' in value)
  );
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') {
    return body;
  }
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

/** Maps anything thrown by the HTTP layer to an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return new ApiError(0, 'Network error', 'The API could not be reached.');
    }
    const body = parseBody(error.error);
    if (isProblemDetails(body)) {
      return new ApiError(
        body.status ?? error.status,
        body.title ?? (error.statusText || 'Request failed'),
        body.detail ?? null,
        body.type ?? 'about:blank',
        body.instance ?? null,
      );
    }
    return new ApiError(error.status, error.statusText || 'Request failed', error.message);
  }
  if (error instanceof Error) {
    return new ApiError(0, 'Unexpected error', error.message);
  }
  return new ApiError(0, 'Unexpected error');
}
