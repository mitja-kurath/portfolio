import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { ProjectDto } from '../../core/api/api.models';
import { WorkSection } from '../../core/content/site-content.model';
import { BreakpointService } from '../../core/state/breakpoint.service';
import { pad2 } from '../../core/util/format';
import { DisplayHeadingComponent } from '../../shared/display-heading/display-heading.component';
import { SectionLabelComponent } from '../../shared/section-label/section-label.component';
import { ProjectCardComponent, ProjectCardView } from './project-card/project-card.component';
import { computeRouteLayout, layoutClassFor } from './route-layout';

@Component({
  selector: 'section[appWork]',
  imports: [SectionLabelComponent, DisplayHeadingComponent, ProjectCardComponent],
  templateUrl: './work.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'work section-wrap', id: 'work' },
})
export class WorkComponent {
  readonly section = input.required<WorkSection>();
  readonly projects = input.required<readonly ProjectDto[]>();

  /** Inline positions must not leak into the stacked mobile layout. */
  private readonly compact = inject(BreakpointService).compact;

  protected readonly layout = computed(() => computeRouteLayout(this.projects().length));

  protected readonly mapHeight = computed(() =>
    this.compact() ? null : this.layout().mapHeight,
  );

  protected readonly cards = computed<ProjectCardView[]>(() => {
    const { tops } = this.layout();
    const compact = this.compact();
    return this.projects().map((project, i) => ({
      project,
      position: pad2(i + 1),
      layoutClass: project.layoutClass ?? layoutClassFor(i),
      top: compact ? null : tops[i],
    }));
  });
}
