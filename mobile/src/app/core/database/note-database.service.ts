import { Injectable } from '@angular/core';
import { Note } from '../models/note.model';

const STORAGE_KEY = 'note-ref.notes';

/**
 * Browser-safe local database adapter for `ionic serve`.
 *
 * Native builds can replace the persistence implementation with
 * @capacitor-community/sqlite while keeping this service API unchanged.
 */
@Injectable({ providedIn: 'root' })
export class NoteDatabaseService {
  private read(): Note[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Note[];
    } catch {
      return [];
    }
  }

  private write(notes: Note[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  async list(): Promise<Note[]> {
    return this.read()
      .filter((note) => !note.deletedAt)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async save(note: Note): Promise<void> {
    const notes = this.read();
    const index = notes.findIndex((item) => item.uuid === note.uuid);

    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.push(note);
    }

    this.write(notes);
  }

  async pending(): Promise<Note[]> {
    return this.read().filter((note) => note.syncStatus === 'pending');
  }

  async markSynced(uuids: string[]): Promise<void> {
    const accepted = new Set(uuids);
    const notes = this.read().map((note) =>
      accepted.has(note.uuid) ? { ...note, syncStatus: 'synced' as const } : note,
    );
    this.write(notes);
  }
}
