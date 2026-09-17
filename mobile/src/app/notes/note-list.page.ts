import { Component, OnInit } from '@angular/core';
import { NoteDatabaseService } from '../core/database/note-database.service';
import { Note } from '../core/models/note.model';
import { SyncService } from '../core/sync/sync.service';

@Component({
  selector: 'app-note-list',
  template: `
    <main>
      <h1>My Notes</h1>
      <button (click)="newNote()">New note</button>
      <button (click)="sync()">Sync</button>
      <p *ngIf="syncMessage">{{ syncMessage }}</p>
      <article *ngFor="let note of notes">
        <h2>{{ note.title }}</h2>
        <p>{{ note.content }}</p>
        <small>{{ note.syncStatus }}</small>
      </article>
    </main>
  `,
})
export class NoteListPage implements OnInit {
  notes: Note[] = [];
  syncMessage = '';

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
      title: 'New note',
      content: '',
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    });
    await this.refresh();
  }

  async sync(): Promise<void> {
    this.syncMessage = 'Syncing...';
    try {
      await this.syncService.sync();
      await this.refresh();
      this.syncMessage = 'Synced';
    } catch {
      this.syncMessage = 'Offline or server unavailable. Local notes are kept.';
    }
  }
}
