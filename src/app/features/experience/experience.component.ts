import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { ExperienceSectionDto, RoleDto } from '../../core/api/api.models';
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
  readonly section = input.required<ExperienceSectionDto>();
  readonly roles = input.required<readonly RoleDto[]>();

  protected readonly roleViews = computed<RoleView[]>(() =>
    toRoleViews(this.roles(), this.section().currentLabel),
  );
}
