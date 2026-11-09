import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProjectDto } from '../../core/api/admin.models';
import { API_CONFIG } from '../../core/api/api.config';
import { apiInterceptor } from '../../core/api/api.interceptor';
import { MOCK_PORTFOLIO } from '../../core/mock/mock-data';
import { ProjectsAdminComponent } from './projects-admin.component';

const PROJECTS: AdminProjectDto[] = MOCK_PORTFOLIO.projects.map((p, i) => ({
  ...p,
  published: i !== 1,
}));

describe('ProjectsAdminComponent', () => {
  let fixture: ComponentFixture<ProjectsAdminComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const settle = async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
  };
  /** Lets pending promises resolve and runs effects (without waiting for open requests). */
  const tick = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    fixture.detectChanges();
  };
  const button = (text: string, scope: ParentNode = el) =>
    Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent!.trim() === text,
    )!;
  const type = (selector: string, value: string) => {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsAdminComponent],
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1', useMock: false, mockDelayMs: 0 } },
      ],
    });
    fixture = TestBed.createComponent(ProjectsAdminComponent);
    el = fixture.nativeElement as HTMLElement;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/v1/admin/projects').flush(PROJECTS);
    await settle();
  });

  afterEach(() => http.verify());

  it('lists projects in order and marks drafts', () => {
    const rows = Array.from(el.querySelectorAll('.admin-list li'));
    expect(rows.map((r) => r.querySelector('strong')!.textContent)).toEqual([
      'Alpine Signal',
      'Nadel',
      'Contour',
      'Feuerstelle',
    ]);
    expect(rows[1].querySelector('.admin-badge')?.textContent).toBe('DRAFT');
    const up = rows[0].querySelector<HTMLButtonElement>('[aria-label="Move Alpine Signal up"]')!;
    expect(up.disabled).toBe(true);
  });

  it('moves a project down via the reorder endpoint', async () => {
    el.querySelector<HTMLButtonElement>('[aria-label="Move Alpine Signal down"]')!.click();
    const req = http.expectOne({ method: 'PUT', url: '/api/v1/admin/projects/order' });
    expect(req.request.body).toEqual({ ids: ['nadel', 'alpine-signal', 'contour', 'feuerstelle'] });
    req.flush([]);
    await tick();
    http.expectOne('/api/v1/admin/projects').flush(PROJECTS);
  });

  it('creates a project with an id suggested from the name', async () => {
    button('+ New project').click();
    fixture.detectChanges();
    type('[formControlName="name"]', 'Trail Log Ü');
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('[formControlName="id"]')!.value).toBe('trail-log-u');

    type('[formControlName="type"]', 'Field notes');
    type('[formControlName="year"]', '2026');
    type('[formControlName="stack"]', 'Angular');
    type('[formControlName="description"]', 'A log.');
    type('[formControlName="latitude"]', 'N 46°');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne({ method: 'POST', url: '/api/v1/admin/projects' });
    expect(req.request.body).toEqual({
      id: 'trail-log-u',
      name: 'Trail Log Ü',
      type: 'Field notes',
      year: '2026',
      stack: 'Angular',
      description: 'A log.',
      artVariant: 1,
      coordinates: ['N 46°'],
      published: true,
    });
    req.flush({ ...req.request.body, order: 5 }, { status: 201, statusText: 'Created' });
    await tick();
    http.expectOne('/api/v1/admin/projects').flush(PROJECTS);
    await settle();
    expect(el.querySelector('.admin-editor')).toBeNull();
  });

  it('edits a project without changing its id and shows server field errors', async () => {
    button('Edit', el.querySelectorAll('.admin-list li')[2]).click();
    fixture.detectChanges();
    const id = el.querySelector<HTMLInputElement>('[formControlName="id"]')!;
    expect(id.value).toBe('contour');
    expect(id.disabled).toBe(true);

    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne({ method: 'PUT', url: '/api/v1/admin/projects/contour' });
    expect(req.request.body.id).toBeUndefined();
    req.flush(
      {
        title: 'Bad Request',
        status: 400,
        detail: 'Some fields are missing or invalid.',
        errors: { artVariant: 'Must be a whole number from 1 to 4.' },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();
    expect(el.querySelector('.admin-error')?.textContent).toContain(
      'Artwork: Must be a whole number from 1 to 4.',
    );
    expect(el.querySelector('.admin-editor')).not.toBeNull();
  });

  it('deletes only after confirmation', async () => {
    const row = el.querySelectorAll('.admin-list li')[3];
    button('Delete', row).click();
    fixture.detectChanges();
    http.expectNone({ method: 'DELETE', url: '/api/v1/admin/projects/feuerstelle' });
    button('Really delete?', row).click();
    http
      .expectOne({ method: 'DELETE', url: '/api/v1/admin/projects/feuerstelle' })
      .flush(null, { status: 204, statusText: 'No Content' });
    await tick();
    http.expectOne('/api/v1/admin/projects').flush(PROJECTS.slice(0, 3));
  });
});
