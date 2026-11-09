import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { SkillGroupDto } from '../../../core/api/api.models';
import { pad2 } from '../../../core/util/format';

@Component({
  selector: 'article[appKitGroup]',
  templateUrl: './kit-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'kit-group' },
})
export class KitGroupComponent {
  readonly group = input.required<SkillGroupDto>();
  /** 1-based position of the group in the grid. */
  readonly position = input.required<number>();

  protected readonly index = computed(() => pad2(this.position()));
  protected readonly count = computed(() => pad2(this.group().items.length));
  protected readonly items = computed(() =>
    this.group().items.map((label, i) => ({ label, index: pad2(i + 1) })),
  );
}
