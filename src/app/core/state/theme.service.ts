import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectionToken, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Opt-in persistence of the theme (see `environment.persistTheme`). */
export const PERSIST_THEME = new InjectionToken<boolean>('PERSIST_THEME', {
  providedIn: 'root',
  factory: () => environment.persistTheme,
});

const STORAGE_KEY = 'mk-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly persist = inject(PERSIST_THEME);

  private readonly darkState = signal(this.readStored());
  readonly dark = this.darkState.asReadonly();

  constructor() {
    effect(() => {
      const theme = this.darkState() ? 'dark' : 'light';
      // setAttribute (not dataset) so this also works in the server DOM during pre-rendering.
      this.document.documentElement.setAttribute('data-theme', theme);
      if (this.persist && this.isBrowser) {
        try {
          localStorage.setItem(STORAGE_KEY, theme);
        } catch {
          // Storage unavailable (private mode, blocked cookies) – ignore.
        }
      }
    });
  }

  toggle(): void {
    this.darkState.update((dark) => !dark);
  }

  setDark(dark: boolean): void {
    this.darkState.set(dark);
  }

  private readStored(): boolean {
    if (!this.persist || !this.isBrowser) {
      return false;
    }
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  }
}
