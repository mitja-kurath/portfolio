import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContourComponent } from './contour.component';
import { CONTOUR_PATHS, STATIC_CONTOUR_PATHS, contourPath } from './contour-paths';

/** Reference implementation copied from the React original. */
function reactPath(n: number): string {
  return `M ${22 + n * 23} ${488 - n * 27} C ${87 + n * 17} ${330 - n * 4}, ${210 + n * 14} ${526 - n * 42}, ${338 + n * 11} ${335 - n * 16} S ${559 + n * 8} ${156 + n * 14}, ${704 + n * 12} ${279 - n * 18} S ${813 - n * 5} ${397 - n * 19}, ${884 - n * 16} ${254 - n * 12}`;
}

@Component({
  imports: [ContourComponent],
  template: `<svg appContour class="hero-contour"></svg>`,
})
class HostComponent {}

describe('contour paths', () => {
  it('matches the original formula for n = 0…6', () => {
    for (let n = 0; n < 7; n++) {
      expect(contourPath(n)).toBe(reactPath(n));
    }
  });

  it('produces the known first and last generated paths', () => {
    expect(contourPath(0)).toBe(
      'M 22 488 C 87 330, 210 526, 338 335 S 559 156, 704 279 S 813 397, 884 254',
    );
    expect(contourPath(6)).toBe(
      'M 160 326 C 189 306, 294 274, 404 239 S 607 240, 776 171 S 783 283, 788 182',
    );
  });

  it('lists 7 generated + 2 static paths', () => {
    expect(CONTOUR_PATHS).toHaveLength(9);
    expect(CONTOUR_PATHS.slice(7)).toEqual(STATIC_CONTOUR_PATHS);
  });
});

describe('ContourComponent', () => {
  it('renders an <svg class="contour …"> with 9 paths and the original attributes', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg')!;

    expect(svg.classList.contains('contour')).toBe(true);
    expect(svg.classList.contains('hero-contour')).toBe(true);
    expect(svg.getAttribute('viewBox')).toBe('0 0 900 620');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.getAttribute('aria-hidden')).toBe('true');

    const paths = Array.from(svg.querySelectorAll('path'));
    expect(paths).toHaveLength(9);
    expect(paths.every((p) => p.namespaceURI === 'http://www.w3.org/2000/svg')).toBe(true);
    expect(paths.map((p) => p.getAttribute('d'))).toEqual([...CONTOUR_PATHS]);
  });
});
