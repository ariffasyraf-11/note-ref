import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { NoteDatabaseService } from '../core/database/note-database.service';
import { Note } from '../core/models/note.model';
import { SyncService } from '../core/sync/sync.service';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Note Ref</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-button expand="block" (click)="newNote()" [disabled]="editing">
        New Note
      </ion-button>
      <ion-button expand="block" fill="outline" (click)="sync()" [disabled]="syncing || editing">
        {{ syncing ? 'Syncing...' : 'Sync with Laravel' }}
      </ion-button>

      <p *ngIf="syncMessage">{{ syncMessage }}</p>

      <ion-list *ngIf="!editing">
        <ion-item *ngFor="let note of notes">
          <ion-label>
            <h2>{{ note.title }}</h2>
            <p>{{ note.content || 'Empty note' }}</p>
            <p><small>{{ note.syncStatus }} · {{ note.updatedAt | date:'short' }}</small></p>
          </ion-label>
          <ion-button slot="end" fill="clear" (click)="editNote(note)">Edit</ion-button>
          <ion-button slot="end" fill="clear" color="danger" (click)="deleteNote(note)">Delete</ion-button>
        </ion-item>

        <ion-item *ngIf="notes.length === 0">
          <ion-label>No notes yet. Create your first note.</ion-label>
        </ion-item>
      </ion-list>

      <div *ngIf="editing">
        <ion-item>
          <ion-label position="stacked">Title</ion-label>
          <ion-input
            [(ngModel)]="draft.title"
            placeholder="Note title"
            maxlength="255"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Content</ion-label>
          <ion-textarea
            [(ngModel)]="draft.content"
            placeholder="Write your note..."
            [autoGrow]="true"
            rows="10"
          ></ion-textarea>
        </ion-item>

        <ion-button expand="block" (click)="saveNote()" [disabled]="!draft.title.trim()">
          Save Note
        </ion-button>
        <ion-button expand="block" fill="outline" (click)="cancelEdit()">
          Cancel
        </ion-button>
      </div>
    </ion-content>
  `,
})
export class NoteListPage implements OnInit {
  notes: Note[] = [];
  syncMessage = '';
  syncing = false;
  editing = false;
  private editingUuid: string | null = null;
  draft: Note = this.emptyDraft();

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
    this.editingUuid = null;
    this.draft = this.emptyDraft();
    this.editing = true;
    this.syncMessage = '';
  }

  editNote(note: Note): void {
    this.editingUuid = note.uuid;
    this.draft = { ...note };
    this.editing = true;
    this.syncMessage = '';
  }

  async saveNote(): Promise<void> {
    const now = new Date().toISOString();
    const title = this.draft.title.trim();

    if (!title) return;

    await this.database.save({
      uuid: this.editingUuid ?? crypto.randomUUID(),
      title,
      content: this.draft.content.trim(),
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    });

    this.editing = false;
    this.editingUuid = null;
    this.draft = this.emptyDraft();
    await this.refresh();
  }

  async deleteNote(note: Note): Promise<void> {
    const confirmed = window.confirm(`Delete "${note.title}"?`);
    if (!confirmed) return;

    await this.database.save({
      ...note,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    });

    await this.refresh();
  }

  cancelEdit(): void {
    this.editing = false;
    this.editingUuid = null;
    this.draft = this.emptyDraft();
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

  private emptyDraft(): Note {
    const now = new Date().toISOString();
    return {
      uuid: '',
      title: '',
      content: '',
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
  }
}
