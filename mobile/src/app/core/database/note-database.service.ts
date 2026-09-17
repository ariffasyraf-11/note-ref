import { Injectable } from '@angular/core';
import { Note } from '../models/note.model';

/**
 * Small database abstraction. Native builds should back this service with
 * @capacitor-community/sqlite. Keeping SQLite access behind this service
 * makes the sync layer independent from the storage implementation.
 */
@Injectable({ providedIn: 'root' })
export class NoteDatabaseService {
  private notes = new Map<string, Note>();

  async list(): Promise<Note[]> {
    return [...this.notes.values()]
      .filter(note => !note.deletedAt)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async save(note: Note): Promise<void> {
    this.notes.set(note.uuid, note);
  }

  async pending(): Promise<Note[]> {
    return [...this.notes.values()].filter(note => note.syncStatus === 'pending');
  }

  async markSynced(uuids: string[]): Promise<void> {
    for (const uuid of uuids) {
      const note = this.notes.get(uuid);
      if (note) this.notes.set(uuid, { ...note, syncStatus: 'synced' });
    }
  }
}
