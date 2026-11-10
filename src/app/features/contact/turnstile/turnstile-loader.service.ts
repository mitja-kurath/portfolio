import { DOCUMENT, Injectable, inject } from '@angular/core';

/** The subset of the Turnstile browser API used here. */
export interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

export interface TurnstileOptions {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'flexible' | 'compact';
  /** `interaction-only`: invisible unless the visitor has to click a check. */
  appearance?: 'always' | 'execute' | 'interaction-only';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Loads Cloudflare's Turnstile script once, on demand (browser only). */
@Injectable({ providedIn: 'root' })
export class TurnstileLoader {
  private readonly document = inject(DOCUMENT);
  private loading: Promise<TurnstileApi> | null = null;

  load(): Promise<TurnstileApi> {
    this.loading ??= new Promise<TurnstileApi>((resolve, reject) => {
      const win = this.document.defaultView as (Window & { turnstile?: TurnstileApi }) | null;
      if (win?.turnstile) {
        resolve(win.turnstile);
        return;
      }
      const script = this.document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () =>
        win?.turnstile ? resolve(win.turnstile) : reject(new Error('Turnstile did not load.'));
      script.onerror = () => {
        this.loading = null;
        reject(new Error('Turnstile could not be loaded.'));
      };
      this.document.head.appendChild(script);
    });
    return this.loading;
  }
}
