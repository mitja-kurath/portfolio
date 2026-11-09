import { TestBed } from '@angular/core/testing';
import { CLOCK_PLACEHOLDER, ClockService, formatClock } from './clock.service';

describe('formatClock', () => {
  // 2025-01-15 07:05:09 UTC → 08:05:09 in Zürich (CET, UTC+1)
  const winter = new Date(Date.UTC(2025, 0, 15, 7, 5, 9));
  // 2025-07-15 22:30:00 UTC → 00:30:00 next day in Zürich (CEST, UTC+2)
  const summer = new Date(Date.UTC(2025, 6, 15, 22, 30, 0));

  it('returns the placeholder before the first tick', () => {
    expect(formatClock(null, 'Europe/Zurich')).toBe(CLOCK_PLACEHOLDER);
    expect(CLOCK_PLACEHOLDER).toBe('--:--:--');
  });

  it('formats HH:MM:SS, 24h, zero padded, in the requested zone', () => {
    expect(formatClock(winter, 'Europe/Zurich')).toBe('08:05:09');
    expect(formatClock(summer, 'Europe/Zurich')).toBe('00:30:00');
    expect(formatClock(winter, 'UTC')).toBe('07:05:09');
    expect(formatClock(winter, 'America/New_York')).toBe('02:05:09');
  });

  it('falls back to Europe/Zurich for an unknown zone', () => {
    expect(formatClock(winter, 'Not/AZone')).toBe('08:05:09');
  });
});

describe('ClockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 7, 5, 9)));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('ticks immediately and then once per second', () => {
    const clock = TestBed.inject(ClockService);
    expect(formatClock(clock.now(), 'UTC')).toBe('07:05:09');

    vi.advanceTimersByTime(1000);
    expect(formatClock(clock.now(), 'UTC')).toBe('07:05:10');

    vi.advanceTimersByTime(3000);
    expect(formatClock(clock.now(), 'UTC')).toBe('07:05:13');
  });

  it('stops ticking when the injector is destroyed', () => {
    const clock = TestBed.inject(ClockService);
    TestBed.resetTestingModule();
    const last = clock.now();
    vi.advanceTimersByTime(5000);
    expect(clock.now()).toBe(last);
  });
});
