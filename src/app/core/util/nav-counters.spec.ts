import { NavItemDto } from '../api/api.models';
import { MOCK_PORTFOLIO } from '../mock/mock-data';
import { byOrder, pad2 } from './format';
import { deriveNavCounts, navBadge } from './nav-counters';

describe('nav counters', () => {
  const { projects, skills, site } = MOCK_PORTFOLIO;

  it('derives Work 04 / Notes 01 / Kit 13 from the original content', () => {
    const counts = deriveNavCounts(projects, skills);
    const badges = site.navigation.map((item) => `${item.label} ${navBadge(item, counts)}`);
    expect(badges).toEqual(['Work 04', 'Notes 01', 'Kit 13', 'Contact ↗']);
  });

  it('follows the data', () => {
    const counts = deriveNavCounts(projects.slice(0, 2), [
      { id: 'a', order: 1, title: 'A', items: Array.from({ length: 12 }, (_, i) => `i${i}`) },
    ]);
    expect(counts).toEqual({ projects: 2, notes: 1, skills: 12 });
  });

  it('handles empty data and a missing notes section', () => {
    expect(deriveNavCounts([], [], false)).toEqual({ projects: 0, notes: 0, skills: 0 });
  });

  it('uses the glyph for items without a counter', () => {
    const item: NavItemDto = { label: 'X', href: '#x', counter: null };
    expect(navBadge(item, deriveNavCounts([], []))).toBe('');
    expect(navBadge({ ...item, glyph: '↗' }, deriveNavCounts([], []))).toBe('↗');
  });
});

describe('format helpers', () => {
  it('pads to two digits', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(4)).toBe('04');
    expect(pad2(13)).toBe('13');
    expect(pad2(120)).toBe('120');
  });

  it('sorts by order without mutating the input', () => {
    const input = [{ order: 3 }, { order: 1 }, { order: 2 }];
    expect(byOrder(input).map((x) => x.order)).toEqual([1, 2, 3]);
    expect(input.map((x) => x.order)).toEqual([3, 1, 2]);
  });
});
