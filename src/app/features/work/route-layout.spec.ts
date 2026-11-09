import {
  CLASSIC_ROUTE_PATH,
  CLASSIC_VIEWBOX,
  computeRouteLayout,
  layoutClassFor,
} from './route-layout';

describe('route layout', () => {
  it('keeps the original stylesheet layout for exactly four projects', () => {
    const layout = computeRouteLayout(4);
    expect(layout.classic).toBe(true);
    expect(layout.mapHeight).toBeNull();
    expect(layout.tops).toEqual([null, null, null, null]);
    expect(layout.viewBox).toBe(CLASSIC_VIEWBOX);
    expect(layout.path).toBe(CLASSIC_ROUTE_PATH);
  });

  it('generalises other counts to 415px steps', () => {
    const layout = computeRouteLayout(6);
    expect(layout.classic).toBe(false);
    expect(layout.tops).toEqual([0, 415, 830, 1245, 1660, 2075]);
    expect(layout.mapHeight).toBe(6 * 415 + 40);
    expect(layout.viewBox).toBe(`0 0 1000 ${6 * 415 + 30}`);
    expect(layout.path.startsWith('M490 0')).toBe(true);
    expect(layout.path.match(/S/g)).toHaveLength(6);
  });

  it('cycles layout classes a, b, c, d, a …', () => {
    expect([0, 1, 2, 3, 4, 5].map(layoutClassFor)).toEqual([
      'project-a',
      'project-b',
      'project-c',
      'project-d',
      'project-a',
      'project-b',
    ]);
  });
});
