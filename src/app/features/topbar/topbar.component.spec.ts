import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MOCK_PORTFOLIO } from '../../core/mock/mock-data';
import { BreakpointService } from '../../core/state/breakpoint.service';
import { deriveNavCounts } from '../../core/util/nav-counters';
import { TopbarComponent } from './topbar.component';

@Component({
  imports: [TopbarComponent],
  template: `<header appTopbar [site]="site" [counts]="counts"></header>`,
})
class HostComponent {
  readonly site = MOCK_PORTFOLIO.site;
  readonly counts = deriveNavCounts(MOCK_PORTFOLIO.projects, MOCK_PORTFOLIO.skills);
}

describe('TopbarComponent', () => {
  const compact = signal(false);

  async function render() {
    TestBed.configureTestingModule({
      providers: [{ provide: BreakpointService, useValue: { compact: compact.asReadonly() } }],
    });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, nav: el.querySelector('nav')!, toggle: el.querySelector<HTMLButtonElement>('.menu-toggle')! };
  }

  it('never makes the desktop nav inert', async () => {
    compact.set(false);
    const { nav } = await render();
    expect(nav.hasAttribute('inert')).toBe(false);
  });

  it('makes the collapsed mobile nav inert until the menu is opened', async () => {
    compact.set(true);
    const { fixture, nav, toggle } = await render();
    expect(nav.hasAttribute('inert')).toBe(true);

    toggle.click();
    await fixture.whenStable();
    expect(nav.hasAttribute('inert')).toBe(false);

    nav.querySelector('a')!.dispatchEvent(new MouseEvent('click'));
    await fixture.whenStable();
    expect(nav.hasAttribute('inert')).toBe(true);
  });
});
