import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NavItem, SiteContent } from '../../core/content/site-content.model';
import { BreakpointService } from '../../core/state/breakpoint.service';
import { ThemeService } from '../../core/state/theme.service';
import { NavCounts, navBadge } from '../../core/util/nav-counters';

interface NavLinkView {
  label: string;
  href: string;
  badge: string;
}

@Component({
  selector: 'header[appTopbar]',
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'topbar',
    '(keydown.escape)': 'closeMenu(true)',
  },
})
export class TopbarComponent {
  readonly site = input.required<SiteContent>();
  readonly counts = input.required<NavCounts>();

  private readonly theme = inject(ThemeService);
  private readonly compact = inject(BreakpointService).compact;
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  protected readonly dark = this.theme.dark;
  protected readonly menuOpen = signal(false);
  /**
   * On mobile the closed menu is only collapsed to height 0; `inert` keeps its links
   * out of the tab order and the accessibility tree until it is opened.
   */
  protected readonly navInert = computed(() => this.compact() && !this.menuOpen());
  protected readonly themeLabel = computed(
    () => `Switch to ${this.dark() ? 'light' : 'dark'} mode`,
  );
  protected readonly links = computed<NavLinkView[]>(() =>
    this.site().navigation.map((item: NavItem) => ({
      label: item.label,
      href: item.href,
      badge: navBadge(item, this.counts()),
    })),
  );

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Closes the menu; with `restoreFocus` (Escape) focus returns to the menu button. */
  protected closeMenu(restoreFocus = false): void {
    if (restoreFocus && this.menuOpen()) {
      this.menuButton().nativeElement.focus();
    }
    this.menuOpen.set(false);
  }
}
