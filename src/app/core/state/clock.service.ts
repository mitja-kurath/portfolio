import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';

export const CLOCK_PLACEHOLDER = '--:--:--';

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Formats `date` as HH:MM:SS (24h) in the given IANA time zone, like the original site. */
export function formatClock(date: Date | null, timeZone: string): string {
  if (!date) {
    return CLOCK_PLACEHOLDER;
  }
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      // Unknown time zone from the API → fall back to the original default.
      return timeZone === 'Europe/Zurich' ? CLOCK_PLACEHOLDER : formatClock(date, 'Europe/Zurich');
    }
    formatters.set(timeZone, formatter);
  }
  return formatter.format(date);
}

/** Emits the current time once per second (browser only). */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly nowState = signal<Date | null>(null);
  readonly now = this.nowState.asReadonly();

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }
    const tick = () => this.nowState.set(new Date());
    tick();
    const id = inject(NgZone).runOutsideAngular(() => setInterval(tick, 1000));
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
