import { RenderMode, ServerRoute } from '@angular/ssr';

/** The single page is pre-rendered to static HTML at build time (outputMode: "static"). */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
