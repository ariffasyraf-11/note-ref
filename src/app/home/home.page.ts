import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSpinner, IonTextarea, IonTitle, IonToolbar } from '@ionic/angular';
import { environment } from '../../environments/environment';

interface Note {
  uuid: string;
  title: string;
  content: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: 'pending' | 'synced';
}
interface SyncResponse { accepted: string[]; }
interface PullResponse { notes: Note[]; cursor: string; }
type SyncState = 'idle' | 'syncing' | 'success' | 'error';

const STORAGE_KEY = 'note-ref.prototype.notes';
const SYNC_CURSOR_KEY = 'note-ref.prototype.syncCursor';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSpinner, IonTextarea, IonTitle, IonToolbar],
})
export class HomePage {
  notes: Note[] = [];
  editing = false;
  editingId: string | null = null;
  draft = { title: '', content: '' };
  syncing = false;
  syncState: SyncState = 'idle';
  syncMessage = '';

  constructor() { this.loadNotes(); }

  get pendingCount(): number {
    return this.readStored().filter((note) => note.syncStatus === 'pending').length;
  }

  startNew(): void {
    this.editingId = null;
    this.draft = { title: '', content: '' };
    this.editing = true;
    this.resetSyncIndicator();
  }

  startEdit(note: Note): void {
    this.editingId = note.uuid;
    this.draft = { title: note.title, content: note.content };
    this.editing = true;
    this.resetSyncIndicator();
  }

  save(): void {
    const title = this.draft.title.trim();
    if (!title) return;
    const now = new Date().toISOString();
    const stored = this.readStored();

    if (this.editingId) {
      const note = stored.find((item) => item.uuid === this.editingId);
      if (note) {
        note.title = title;
        note.content = this.draft.content.trim();
        note.updatedAt = now;
        note.deletedAt = null;
        note.syncStatus = 'pending';
      }
    } else {
      stored.unshift({
        uuid: crypto.randomUUID(),
        title,
        content: this.draft.content.trim(),
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending',
      });
    }

    this.writeStored(stored);
    this.loadNotes();
    this.cancel();
  }

  remove(note: Note): void {
    if (!window.confirm(`Delete "${note.title}"?`)) return;
    const now = new Date().toISOString();
    const stored = this.readStored();
    const target = stored.find((item) => item.uuid === note.uuid);

    if (target) {
      target.deletedAt = now;
      target.updatedAt = now;
      target.syncStatus = 'pending';
      this.writeStored(stored);
    }

    this.loadNotes();
    this.resetSyncIndicator();
  }

  cancel(): void {
    this.editing = false;
    this.editingId = null;
    this.draft = { title: '', content: '' };
  }

  async sync(): Promise<void> {
    if (this.syncing) return;

    this.syncing = true;
    this.syncState = 'syncing';
    this.syncMessage = 'Syncing...';

    try {
      const stored = this.readStored();
      const pending = stored.filter((note) => note.syncStatus === 'pending');

      if (pending.length) {
        const syncResponse = await this.request<SyncResponse>('/notes/sync', 'POST', { notes: pending });
        const accepted = new Set(syncResponse.accepted);
        for (const note of stored) {
          if (accepted.has(note.uuid)) note.syncStatus = 'synced';
        }
        this.writeStored(stored);
      }

      const cursor = localStorage.getItem(SYNC_CURSOR_KEY);
      const query = cursor ? `?updated_since=${encodeURIComponent(cursor)}` : '';
      const pulled = await this.request<PullResponse>(`/notes${query}`, 'GET');
      const latestStored = this.readStored();

      for (const remote of pulled.notes) {
        const current = latestStored.find((note) => note.uuid === remote.uuid);
        if (!current || current.syncStatus === 'synced' || remote.updatedAt > current.updatedAt) {
          const index = latestStored.findIndex((note) => note.uuid === remote.uuid);
          const syncedNote: Note = {
            uuid: remote.uuid,
            title: remote.title,
            content: remote.content ?? '',
            updatedAt: remote.updatedAt,
            deletedAt: remote.deletedAt ?? null,
            syncStatus: 'synced',
          };
          if (index >= 0) latestStored[index] = syncedNote;
          else latestStored.push(syncedNote);
        }
      }

      this.writeStored(latestStored);
      localStorage.setItem(SYNC_CURSOR_KEY, pulled.cursor);
      this.loadNotes();
      this.syncState = 'success';
      this.syncMessage = '✓ All changes synced.';
    } catch (error) {
      console.error('Note sync failed:', error);
      this.syncState = 'error';
      this.syncMessage = 'Sync failed. Local changes are kept.';
    } finally {
      this.syncing = false;
    }
  }

  private resetSyncIndicator(): void {
    this.syncState = 'idle';
    this.syncMessage = '';
  }

  private loadNotes(): void {
    this.notes = this.readStored()
      .filter((note) => !note.deletedAt)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private readStored(): Note[] {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<Partial<Note> & { id?: string }>;
      return raw.map((note) => ({
        uuid: note.uuid ?? note.id ?? crypto.randomUUID(),
        title: note.title ?? '',
        content: note.content ?? '',
        updatedAt: note.updatedAt ?? new Date().toISOString(),
        deletedAt: note.deletedAt ?? null,
        syncStatus: note.syncStatus ?? 'pending',
      }));
    } catch {
      return [];
    }
  }

  private writeStored(notes: Note[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  private async request<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const response = await fetch(`${environment.apiUrl}${path}`, {
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }
}
