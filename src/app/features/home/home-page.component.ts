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
import { SITE_CONTENT } from '../../core/content/site-content';
import { PortfolioStore } from '../../core/state/portfolio.store';
import { SeoService } from '../../core/state/seo.service';
import { NavCounts, deriveNavCounts } from '../../core/util/nav-counters';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';
import { EquipmentComponent } from '../equipment/equipment.component';
import { ExperienceComponent } from '../experience/experience.component';
import { FooterComponent } from '../footer/footer.component';
import { HeroComponent } from '../hero/hero.component';
import { ErrorStateComponent } from '../status/error-state.component';
import { LoadingStateComponent } from '../status/loading-state.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { WorkComponent } from '../work/work.component';

@Component({
  selector: 'app-home-page',
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
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
/** The portfolio page (route ''): static sections plus the API-driven ones. */
export class HomePageComponent {
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
