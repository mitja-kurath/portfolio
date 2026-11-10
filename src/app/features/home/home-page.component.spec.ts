import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { API_CONFIG } from '../../core/api/api.config';
import { apiInterceptor } from '../../core/api/api.interceptor';
import { mockApiInterceptor } from '../../core/api/mock-api.interceptor';
import { CONTACT_FORM_SETTINGS } from '../contact/contact-form/contact-form.settings';

describe('HomePageComponent (rendered against the mock API)', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let el: HTMLElement;

  const text = (selector: string) =>
    (el.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const classesOf = (selector: string) =>
    Array.from(el.querySelectorAll(selector)).map((node) => node.getAttribute('class'));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor, mockApiInterceptor])),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1', useMock: true, mockDelayMs: 0 } },
        { provide: CONTACT_FORM_SETTINGS, useValue: { enabled: true, turnstileSiteKey: '' } },
      ],
    });
    fixture = TestBed.createComponent(HomePageComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    // While /portfolio loads, the static sections are already there; data sections wait.
    expect(el.querySelector('.hero h1')?.textContent).toContain('MITJA');
    expect(el.querySelector('#contact')).not.toBeNull();
    expect(el.querySelector('section.api-loading[aria-busy="true"]')).not.toBeNull();
    expect(el.querySelector('#work')).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
  });

  it('renders the shell and every section in the original order', () => {
    const shell = el.querySelector('main.site-shell')!;
    const children = Array.from(shell.children).map(
      (child) => `${child.tagName.toLowerCase()}.${child.classList[0] ?? ''}`,
    );
    expect(children).toEqual([
      'div.cursor-dot',
      'header.topbar',
      'section.hero',
      'section.work',
      'section.about',
      'section.equipment',
      'section.experience',
      'section.contact',
      'footer.',
    ]);
    expect(Array.from(shell.querySelectorAll(':scope > section')).map((s) => s.id)).toEqual([
      'base-camp',
      'work',
      'about',
      'equipment',
      'experience',
      'contact',
    ]);
  });

  it('derives nav counters from data', () => {
    const links = Array.from(el.querySelectorAll('nav a')).map((a) =>
      a.textContent!.replace(/\s+/g, ' ').trim(),
    );
    expect(links).toEqual(['Work 04', 'Notes 01', 'Kit 15', 'Contact ↗']);
  });

  it('toggles the mobile menu and closes it on navigation', () => {
    const nav = el.querySelector('nav')!;
    const button = el.querySelector<HTMLButtonElement>('.menu-toggle')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(nav.classList.contains('nav-open')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    nav.querySelector<HTMLAnchorElement>('a')!.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
    expect(nav.classList.contains('nav-open')).toBe(false);
  });

  it('toggles the theme and its aria-label', () => {
    const button = el.querySelector<HTMLButtonElement>('.theme-toggle')!;
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
    button.click();
    TestBed.tick();
    fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
    button.click();
    TestBed.tick();
  });

  it('renders the hero without the route and kicker labels', () => {
    expect(el.querySelector('.hero h1')!.innerHTML.replace(/<!--.*?-->/g, '')).toBe(
      'MITJA<br><span>KURATH</span>',
    );
    expect(el.querySelector('.hero-route')).toBeNull();
    expect(text('.hero-kicker')).toBe('47° 25′ 28″ N 09° 22′ 36″ E');
    expect(text('.hero-altitude')).toBe('ALT.670 M');
    expect(el.querySelectorAll('.hero-tagline br')).toHaveLength(2);
    expect(el.querySelector('svg.contour.hero-contour')).not.toBeNull();
  });

  it('renders project cards with positional + art classes and route nodes', () => {
    expect(classesOf('.route-map > article')).toEqual([
      'project-card project-a',
      'project-card project-b',
      'project-card project-c',
      'project-card project-d',
    ]);
    expect(classesOf('.project-art')).toEqual([
      // The motif follows each project's artVariant, not its position.
      'project-art art-3',
      'project-art art-1',
      'project-art art-2',
      'project-art art-4',
    ]);
    expect(el.querySelector('.art-1 .signal-rings')).not.toBeNull();
    expect(el.querySelector('.art-2 .needle-grid')).not.toBeNull();
    expect(el.querySelector('.art-3 svg.contour')).not.toBeNull();
    expect(el.querySelector('.art-4 .fire-symbol')).not.toBeNull();
    expect(Array.from(el.querySelectorAll('.route-node')).map((n) => n.textContent)).toEqual([
      '01',
      '02',
      '03',
      '04',
    ]);
    expect(el.querySelector('.route-line')!.getAttribute('viewBox')).toBe('0 0 1000 1690');
    expect(el.querySelector<HTMLElement>('.route-map')!.style.height).toBe('');
  });

  it('renders headings with <br> and <em> like the original', () => {
    const html = (selector: string) =>
      el.querySelector(selector)!.innerHTML.replace(/<!--.*?-->/g, '').replace(/\s+/g, ' ').trim();
    expect(html('.work h2')).toBe('Selected <br><em>waypoints.</em>');
    expect(html('.equipment h2')).toBe('What’s in <br> the <em>pack.</em>');
    expect(text('.contact h2')).toBe('LET’S BUILD SOMETHING TOGETHER.');
  });

  it('renders kit groups with derived counts and indices', () => {
    const titles = Array.from(el.querySelectorAll('.kit-title')).map((title) =>
      Array.from(title.children).map((child) => child.textContent),
    );
    expect(titles).toEqual([
      ['01', 'Essentials', '05'],
      ['02', 'Navigation', '05'],
      ['03', 'Base layer', '05'],
    ]);
    expect(Array.from(el.querySelectorAll('.kit-group:first-child li small')).map((s) => s.textContent)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
    ]);
  });

  it('renders roles in the styled slots with NOW for the current role', () => {
    expect(classesOf('.role')).toEqual(['role role-1', 'role role-2', 'role role-3', 'role role-4']);
    expect(Array.from(el.querySelectorAll('.role b')).map((b) => b.textContent)).toEqual([
      '2023',
      '2025',
      'NOW',
      '2027',
    ]);
    expect(classesOf('.chart-alt')).toEqual(['chart-alt alt-1', 'chart-alt alt-2', 'chart-alt alt-3']);
  });

  it('renders the signpost from contact links', () => {
    const signs = Array.from(el.querySelectorAll<HTMLAnchorElement>('.signpost a'));
    expect(signs.map((s) => s.getAttribute('class'))).toEqual([
      'sign sign-email',
      'sign sign-github',
      'sign sign-linkedin',
    ]);
    expect(signs[0].getAttribute('href')).toBe('mailto:hi@mitjakurath.ch');
    expect(signs[0].hasAttribute('target')).toBe(false);
    expect(signs[1].getAttribute('target')).toBe('_blank');
    expect(signs[1].getAttribute('rel')).toBe('noreferrer');
    expect(signs[1].firstElementChild!.tagName).toBe('B');
    expect(signs[2].lastElementChild!.tagName).toBe('B');
    expect(el.querySelector('app-contact-form form[aria-labelledby="contact-form-title"]')).not.toBeNull();
  });

  it('renders the footer with clock, zone label and current year', () => {
    expect(text('.footer-time strong')).toMatch(/^\d{2}:\d{2}:\d{2} CET$/);
    expect(text('footer p')).toBe(
      `Made with care & a little trail dust.© ${new Date().getFullYear()} MITJA KURATH`,
    );
    expect(text('footer > a')).toBe('BACK TO BASE CAMP ↑');
  });

  it('applies SEO, Open Graph and JSON-LD from the static site content', () => {
    const meta = (selector: string) => document.querySelector(selector)?.getAttribute('content');
    expect(document.title).toBe('Mitja Kurath – Base Camp');
    expect(meta('meta[name="description"]')).toContain('Mitja Kurath');
    expect(meta('meta[property="og:title"]')).toBe('Mitja Kurath – Base Camp');
    expect(meta('meta[name="twitter:card"]')).toBe('summary');
    const jsonLd = JSON.parse(document.getElementById('person-jsonld')!.textContent!);
    expect(jsonLd).toMatchObject({
      '@type': 'Person',
      name: 'Mitja Kurath',
      email: 'hi@mitjakurath.ch',
      sameAs: ['https://github.com/mitja-kurath', 'https://www.linkedin.com/in/mitja-kurath-b40827323/'],
    });
  });

  it('keeps the collapsed mobile menu out of the tab order and closes it on Escape', () => {
    const nav = el.querySelector('nav')!;
    const button = el.querySelector<HTMLButtonElement>('.menu-toggle')!;
    // jsdom has no matchMedia → desktop layout → never inert.
    expect(nav.hasAttribute('inert')).toBe(false);

    button.click();
    fixture.detectChanges();
    el.querySelector('header')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(nav.classList.contains('nav-open')).toBe(false);
    expect(document.activeElement).toBe(button);
  });
});
