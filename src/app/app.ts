import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  Injector,
  PLATFORM_ID,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SITE_CONTENT } from './core/content/site-content';
import { PortfolioStore } from './core/state/portfolio.store';
import { SeoService } from './core/state/seo.service';
import { ThemeService } from './core/state/theme.service';
import { NavCounts, deriveNavCounts } from './core/util/nav-counters';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { EquipmentComponent } from './features/equipment/equipment.component';
import { ExperienceComponent } from './features/experience/experience.component';
import { FooterComponent } from './features/footer/footer.component';
import { HeroComponent } from './features/hero/hero.component';
import { ErrorStateComponent } from './features/status/error-state.component';
import { LoadingStateComponent } from './features/status/loading-state.component';
import { TopbarComponent } from './features/topbar/topbar.component';
import { WorkComponent } from './features/work/work.component';

@Component({
  selector: 'app-root',
  imports: [
    TopbarComponent,
    HeroComponent,
    WorkComponent,
    AboutComponent,
    EquipmentComponent,
    ExperienceComponent,
    ContactComponent,
    FooterComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class App {
  protected readonly store = inject(PortfolioStore);
  protected readonly site = SITE_CONTENT;
  protected readonly navCounts = computed<NavCounts>(() =>
    deriveNavCounts(this.store.projects(), this.store.skills(), !!this.site.sections.about),
  );

  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private firstReadyHandled = false;

  constructor() {
    // Instantiating the service applies data-theme="light" on <html>.
    inject(ThemeService);

    this.seo.apply(this.site);

    effect(() => {
      if (this.store.status() !== 'ready' || this.firstReadyHandled || !this.isBrowser) {
        return;
      }
      this.firstReadyHandled = true;
      // Deep links like /#contact when the page was not pre-rendered: the target only
      // exists once content has rendered.
      afterNextRender(() => this.scrollToFragment(), { injector: this.injector });
    });
  }

  protected retry(): void {
    this.store.reload();
  }

  private scrollToFragment(): void {
    const id = decodeURIComponent(this.document.location.hash.slice(1));
    const target = id ? this.document.getElementById(id) : null;
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView();
    }
  }
}
