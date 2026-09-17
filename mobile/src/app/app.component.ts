import { Component } from '@angular/core';
import { IonApp } from '@ionic/angular/standalone';
import { NoteListPage } from './notes/note-list.page';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, NoteListPage],
  template: `
    <ion-app>
      <app-note-list></app-note-list>
    </ion-app>
  `,
})
export class AppComponent {}
