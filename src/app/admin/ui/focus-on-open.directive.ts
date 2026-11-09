import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * Moves keyboard focus into an editor when it opens and scrolls it into view
 * (the editor renders below the list, often off-screen).
 */
@Directive({ selector: '[appFocusOnOpen]' })
export class FocusOnOpenDirective {
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      const field = host.querySelector<HTMLElement>('input:not([disabled]), textarea, select');
      if (typeof host.scrollIntoView === 'function') {
        host.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
      field?.focus({ preventScroll: true });
    });
  }
}
