import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * Large section heading: lines separated by <br>, followed by the emphasised <em> part,
 * either on its own line (default) or continuing the last line (`inline`).
 * Used as an attribute so the host *is* the <h2> the original CSS targets.
 */
@Component({
  selector: 'h2[appDisplayHeading]',
  template: `
    @for (line of lines(); track $index) {
      @if (!$first) {<br />}
      {{ line }}
    }
    @if (lines().length) {
      @if (inline()) {&ngsp;} @else {<br />}
    }
    <em>{{ emphasis() }}</em>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DisplayHeadingComponent {
  readonly lines = input.required<readonly string[]>();
  readonly emphasis = input.required<string>();
  readonly inline = input(false);
}
