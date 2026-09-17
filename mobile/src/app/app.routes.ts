import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'notes',
    pathMatch: 'full',
  },
  {
    path: 'notes',
    loadComponent: () =>
      import('./notes/note-list.page').then((module) => module.NoteListPage),
  },
  {
    path: '**',
    redirectTo: 'notes',
  },
];
