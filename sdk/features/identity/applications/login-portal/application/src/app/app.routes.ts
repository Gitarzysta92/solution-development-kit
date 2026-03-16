import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./oauth-callback.component').then((m) => m.OAuthCallbackComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
