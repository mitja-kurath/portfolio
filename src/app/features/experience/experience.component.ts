import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { RoleDto } from '../../core/api/api.models';
import { ExperienceSection } from '../../core/content/site-content.model';
import { DisplayHeadingComponent } from '../../shared/display-heading/display-heading.component';
import { SectionLabelComponent } from '../../shared/section-label/section-label.component';
import { RoleView, toRoleViews } from './role-layout';

@Component({
  selector: 'section[appExperience]',
  imports: [SectionLabelComponent, DisplayHeadingComponent],
  templateUrl: './experience.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'experience section-wrap', id: 'experience' },
})
export class ExperienceComponent {
  readonly section = input.required<ExperienceSection>();
  readonly roles = input.required<readonly RoleDto[]>();

  protected readonly roleViews = computed<RoleView[]>(() =>
    toRoleViews(this.roles(), this.section().currentLabel),
  );
}
