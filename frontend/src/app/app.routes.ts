import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'research/:sessionId',
    loadComponent: () =>
      import('./pages/research/research.component').then(m => m.ResearchComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history.component').then(m => m.HistoryComponent),
  },
  {
    path: 'notes',
    loadComponent: () =>
      import('./pages/notes/notes.component').then(m => m.NotesComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then(m => m.SettingsComponent),
  },
  { path: '**', redirectTo: '' },
];
