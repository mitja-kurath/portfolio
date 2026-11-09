import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { ArtVariant } from '../../../core/api/api.models';
import { ContourComponent } from '../../../shared/contour/contour.component';

/** Illustrated card artwork; the motif is chosen by `variant`, not by list position. */
@Component({
  selector: 'div[appProjectArt]',
  imports: [ContourComponent],
  templateUrl: './project-art.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'project-art',
    '[class.art-1]': 'variant() === 1',
    '[class.art-2]': 'variant() === 2',
    '[class.art-3]': 'variant() === 3',
    '[class.art-4]': 'variant() === 4',
  },
})
export class ProjectArtComponent {
  readonly variant = input.required<ArtVariant>();
  readonly coordinates = input.required<readonly string[]>();
  readonly index = input.required<string>();
}
