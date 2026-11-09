import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CONTOUR_PATHS } from './contour-paths';

/**
 * Decorative topographic lines. Applied as an attribute on an <svg> so the DOM matches
 * the original exactly: `<svg appContour class="hero-contour">` → `<svg class="contour hero-contour">`.
 * Extra classes are passed with the native `class` attribute.
 */
@Component({
  selector: 'svg[appContour]',
  template: `@for (d of paths; track $index) {<svg:path [attr.d]="d" />}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'contour',
    viewBox: '0 0 900 620',
    fill: 'none',
    'aria-hidden': 'true',
  },
})
export class ContourComponent {
  protected readonly paths = CONTOUR_PATHS;
}
