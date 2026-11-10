import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';
import { TurnstileApi, TurnstileLoader } from './turnstile-loader.service';

/**
 * Cloudflare Turnstile spam check. Emits a fresh token (or null when it expires or fails).
 * Rendered in the browser only; tokens are single-use, so call `reset()` after each submit.
 */
@Component({
  selector: 'app-turnstile',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'turnstile' },
})
export class TurnstileComponent {
  readonly siteKey = input.required<string>();
  readonly tokenChange = output<string | null>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly loader = inject(TurnstileLoader);
  private api: TurnstileApi | null = null;
  private widgetId: string | null = null;
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      if (this.api && this.widgetId) this.api.remove(this.widgetId);
    });

    afterNextRender(() => {
      this.loader
        .load()
        .then((api) => {
          if (this.destroyed) return;
          this.api = api;
          this.widgetId = api.render(this.host.nativeElement, {
            sitekey: this.siteKey(),
            theme: 'light',
            size: 'flexible',
            appearance: 'interaction-only',
            callback: (token) => this.tokenChange.emit(token),
            'expired-callback': () => this.tokenChange.emit(null),
            'error-callback': () => this.tokenChange.emit(null),
          });
        })
        .catch(() => this.tokenChange.emit(null));
    });
  }

  /** Requests a new token (the previous one was used or expired). */
  reset(): void {
    this.tokenChange.emit(null);
    if (this.api && this.widgetId) this.api.reset(this.widgetId);
  }
}
