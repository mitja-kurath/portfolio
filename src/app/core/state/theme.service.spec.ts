import { TestBed } from '@angular/core/testing';
import { PERSIST_THEME, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = () => document.documentElement;

  afterEach(() => {
    delete root().dataset['theme'];
    localStorage.clear();
  });

  function create(persist = false): ThemeService {
    TestBed.configureTestingModule({ providers: [{ provide: PERSIST_THEME, useValue: persist }] });
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  }

  it('starts in light mode and writes data-theme="light"', () => {
    const service = create();
    expect(service.dark()).toBe(false);
    expect(root().dataset['theme']).toBe('light');
  });

  it('toggles to dark and back', () => {
    const service = create();
    service.toggle();
    TestBed.tick();
    expect(service.dark()).toBe(true);
    expect(root().dataset['theme']).toBe('dark');

    service.toggle();
    TestBed.tick();
    expect(root().dataset['theme']).toBe('light');
  });

  it('does not touch localStorage unless persistence is enabled', () => {
    const service = create(false);
    service.setDark(true);
    TestBed.tick();
    expect(localStorage.getItem('mk-theme')).toBeNull();
  });

  it('persists and restores the theme when opted in', () => {
    localStorage.setItem('mk-theme', 'dark');
    const service = create(true);
    expect(service.dark()).toBe(true);

    service.setDark(false);
    TestBed.tick();
    expect(localStorage.getItem('mk-theme')).toBe('light');
  });
});
