import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

/** Must match the `@media (max-width: 800px)` block in styles.css. */
export const COMPACT_QUERY = '(max-width: 800px)';

/** Exposes whether the mobile layout from styles.css is active. */
@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private readonly compactState = signal(false);
  readonly compact = this.compactState.asReadonly();

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID)) || typeof matchMedia !== 'function') {
      return;
    }
    const query = matchMedia(COMPACT_QUERY);
    this.compactState.set(query.matches);
    const onChange = (event: MediaQueryListEvent) => this.compactState.set(event.matches);
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }
}
