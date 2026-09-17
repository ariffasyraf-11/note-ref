import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonButton, IonContent, IonHeader, IonItem, IonList, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NoteDatabaseService } from '../core/database/note-database.service';
import { Note } from '../core/models/note.model';
import { SyncService } from '../core/sync/sync.service';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, IonButton, IonContent, IonHeader, IonItem, IonList, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Note Ref</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-button expand="block" (click)="newNote()">New Note</ion-button>
      <ion-button expand="block" fill="outline" (click)="sync()" [disabled]="syncing">
        {{ syncing ? 'Syncing...' : 'Sync with Laravel' }}
      </ion-button>
      <p *ngIf="syncMessage">{{ syncMessage }}</p>

      <ion-list>
        <ion-item *ngFor="let note of notes">
          <div>
            <strong>{{ note.title }}</strong>
            <p>{{ note.content || 'Empty note' }}</p>
            <small>{{ note.syncStatus }}</small>
          </div>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class NoteListPage implements OnInit {
  notes: Note[] = [];
  syncMessage = '';
  syncing = false;

  constructor(
    private readonly database: NoteDatabaseService,
    private readonly syncService: SyncService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.notes = await this.database.list();
  }

  async newNote(): Promise<void> {
    const now = new Date().toISOString();
    await this.database.save({
      uuid: crypto.randomUUID(),
      title: `New note ${this.notes.length + 1}`,
      content: 'Created locally. Press Sync to send it to Laravel.',
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    });
    await this.refresh();
  }

  async sync(): Promise<void> {
    if (this.syncing) return;

    this.syncing = true;
    this.syncMessage = 'Syncing...';

    try {
      await this.syncService.sync();
      await this.refresh();
      this.syncMessage = 'Sync completed successfully.';
    } catch (error) {
      console.error('Note sync failed:', error);
      this.syncMessage = 'Sync failed. Check the Laravel API URL, server, CORS, and browser console.';
    } finally {
      this.syncing = false;
    }
  }
}
