import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Both routes are pre-rendered to static HTML at build time (outputMode: "static").
 * The admin page is pre-rendered as an empty shell; it loads its data in the browser only.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
