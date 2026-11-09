import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { ProjectDto } from '../../../core/api/api.models';
import { ProjectArtComponent } from '../project-art/project-art.component';

export interface ProjectCardView {
  project: ProjectDto;
  /** Zero-padded 1-based position, e.g. `01`. */
  position: string;
  /** `project-a` … `project-d`. */
  layoutClass: string;
  /** Inline top offset (px) for non-classic layouts; null → stylesheet. */
  top: number | null;
}

@Component({
  selector: 'article[appProjectCard]',
  imports: [ProjectArtComponent],
  templateUrl: './project-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'project-card' },
})
export class ProjectCardComponent {
  readonly card = input.required<ProjectCardView>();
}
