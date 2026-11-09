import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_CONFIG, isRelativeApiPath, joinApiUrl } from './api.config';
import { toApiError } from './api-error';

/**
 * Prefixes relative API paths with the configured base URL, asks for JSON
 * (or RFC 7807 problem+json) and normalises every failure to `ApiError`.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isRelativeApiPath(req.url)) {
    return next(req);
  }
  const { baseUrl } = inject(API_CONFIG);
  const apiReq = req.clone({
    url: joinApiUrl(baseUrl, req.url),
    setHeaders: { Accept: 'application/json, application/problem+json' },
  });
  return next(apiReq).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
};
