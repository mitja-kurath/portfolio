import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, mergeMap, timer } from 'rxjs';
import { API_CONFIG, API_ENDPOINTS, joinApiUrl } from './api.config';
import { ContactMessageRequest, ContactMessageResponse, PortfolioDto } from './api.models';

type MockHandler = (req: HttpRequest<unknown>, data: PortfolioDto) => HttpResponse<unknown>;

function ok<T>(body: T, status = 200): HttpResponse<T> {
  return new HttpResponse({ status, body: structuredClone(body) });
}

function problem(
  req: HttpRequest<unknown>,
  status: number,
  title: string,
  detail: string,
): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    statusText: title,
    url: req.url,
    error: { type: 'about:blank', title, status, detail, instance: req.url },
  });
}

function isContactMessage(body: unknown): body is ContactMessageRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const { name, email, message } = body as Record<string, unknown>;
  return (
    typeof name === 'string' &&
    name.trim() !== '' &&
    typeof email === 'string' &&
    email.includes('@') &&
    typeof message === 'string' &&
    message.trim() !== ''
  );
}

const GET_HANDLERS: Readonly<Record<string, MockHandler>> = {
  [API_ENDPOINTS.site]: (_, data) => ok(data.site),
  [API_ENDPOINTS.projects]: (_, data) => ok(data.projects),
  [API_ENDPOINTS.skills]: (_, data) => ok(data.skills),
  [API_ENDPOINTS.experience]: (_, data) => ok(data.experience),
  [API_ENDPOINTS.portfolio]: (_, data) => ok(data),
};

const POST_HANDLERS: Readonly<Record<string, MockHandler>> = {
  [API_ENDPOINTS.contactMessages]: (req) => {
    if (!isContactMessage(req.body)) {
      throw problem(req, 400, 'Bad Request', 'name, email and message are required.');
    }
    const response: ContactMessageResponse = {
      id: `mock-${Date.now().toString(36)}`,
      receivedAt: new Date().toISOString(),
    };
    return ok(response, 201);
  },
};

function handlersFor(method: string): Readonly<Record<string, MockHandler>> {
  if (method === 'GET') {
    return GET_HANDLERS;
  }
  return method === 'POST' ? POST_HANDLERS : {};
}

/**
 * Answers API requests from `mock-data.ts` when `API_CONFIG.useMock` is true and
 * passes everything through otherwise. The mock data is loaded with a dynamic import,
 * so it is a separate chunk that production (useMock: false) never downloads.
 * Runs after `apiInterceptor`, so it sees fully prefixed URLs and its errors go
 * through the same `ApiError` normalisation as real ones.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const { baseUrl, useMock, mockDelayMs } = inject(API_CONFIG);
  const prefix = joinApiUrl(baseUrl, '');
  const path = req.url.split('?')[0];
  if (!useMock || !path.startsWith(prefix)) {
    return next(req);
  }
  const endpoint = path.slice(prefix.length).replace(/\/+$/, '');
  const handler = handlersFor(req.method)[endpoint];

  const respond: Observable<HttpEvent<unknown>> = from(import('../mock/mock-data')).pipe(
    mergeMap(async ({ MOCK_PORTFOLIO }) => {
      if (!handler) {
        throw problem(req, 404, 'Not Found', `No mock for ${req.method} /${endpoint}.`);
      }
      return handler(req, MOCK_PORTFOLIO);
    }),
  );

  return timer(mockDelayMs).pipe(mergeMap(() => respond));
};
