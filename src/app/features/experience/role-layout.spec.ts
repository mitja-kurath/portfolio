import { RoleDto } from '../../core/api/api.models';
import { ridgeY, toRoleViews } from './role-layout';

const role = (i: number): RoleDto => ({
  id: `r${i}`,
  order: i,
  year: String(2015 + i),
  title: `Role ${i}`,
  subtitle: 'sub',
  isCurrent: false,
});

describe('role layout', () => {
  it('follows the ridge vertices', () => {
    expect(ridgeY(230)).toBe(366);
    expect(ridgeY(942)).toBe(95);
    expect(ridgeY(345)).toBe(327);
  });

  it('uses the styled slots for up to four roles', () => {
    const views = toRoleViews([role(1), role(2), role(3), role(4)], 'NOW');
    expect(views.map((v) => v.slotClass)).toEqual(['role-1', 'role-2', 'role-3', 'role-4']);
    expect(views.every((v) => v.left === null && v.top === null)).toBe(true);
  });

  it('places extra roles with their dot on the ridge', () => {
    const views = toRoleViews([1, 2, 3, 4, 5].map(role), 'NOW');
    expect(views[0]).toMatchObject({ slotClass: null, left: '19.17%', top: '405px' });
    expect(views[4]).toMatchObject({ left: '78.50%', top: '134px' });
  });
});
