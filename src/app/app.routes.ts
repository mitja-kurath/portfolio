import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/home-page.component';

/**
 * The portfolio is one page navigated by in-page anchors (#work, #about, …).
 * The admin panel is lazy-loaded, so visitors never download it.
 */
export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  {
    path: 'admin',
    title: 'Admin – Base Camp',
    loadComponent: () => import('./admin/admin-page.component').then((m) => m.AdminPageComponent),
  },
  { path: '**', redirectTo: '' },
];
