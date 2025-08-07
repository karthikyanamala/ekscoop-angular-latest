import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
   {
    path: 'questions/:slug',
    renderMode: RenderMode.Server // Use 'Server' to support dynamic meta
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender, // ✅ Use 'Server' instead of 'Dynamic'
  }
];
