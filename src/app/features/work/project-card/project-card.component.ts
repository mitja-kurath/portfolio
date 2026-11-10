import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
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
  imports: [ProjectArtComponent, NgOptimizedImage],
  templateUrl: './project-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'project-card', '[style.--name-chars]': 'longestWord()' },
})
export class ProjectCardComponent {
  readonly card = input.required<ProjectCardView>();

  /** Length of the name's longest word; the title shrinks so that word fits the card. */
  protected readonly longestWord = computed(() =>
    Math.max(1, ...this.card().project.name.split(/\s+/).map((word) => word.length)),
  );
}
