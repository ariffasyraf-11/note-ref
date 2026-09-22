import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface StoredNote {
  uuid: string;
  title: string;
  content: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: 'pending' | 'synced';
}

@Injectable({ providedIn: 'root' })
export class NoteDatabaseService {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private readonly databaseName = 'note_ref_test';

  async initialize(): Promise<void> {
    if (this.db) return;
    if (Capacitor.getPlatform() === 'web') {
      throw new Error('SQLite test version requires a native Capacitor build.');
    }
    const consistency = await this.sqlite.checkConnectionsConsistency();
    if (!consistency.result) await this.sqlite.closeAllConnections();
    this.db = await this.sqlite.createConnection(this.databaseName, false, 'no-encryption', 1, false);
    await this.db.open();
    await this.db.execute('CREATE TABLE IF NOT EXISTS notes (uuid TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT \'\', updated_at TEXT NOT NULL, deleted_at TEXT, sync_status TEXT NOT NULL DEFAULT \'pending\');');
    await this.db.execute('CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);');
    await this.db.execute('CREATE TABLE IF NOT EXISTS sync_state (key TEXT PRIMARY KEY NOT NULL, value TEXT);');
  }

  async getNotes(): Promise<StoredNote[]> {
    await this.ensureReady();
    const result = await this.db!.query('SELECT uuid, title, content, updated_at, deleted_at, sync_status FROM notes ORDER BY updated_at DESC');
    return (result.values ?? []).map(row => ({
      uuid: String(row.uuid),
      title: String(row.title ?? ''),
      content: String(row.content ?? ''),
      updatedAt: String(row.updated_at),
      deletedAt: row.deleted_at ? String(row.deleted_at) : null,
      syncStatus: row.sync_status === 'synced' ? 'synced' : 'pending',
    }));
  }

  async saveNotes(notes: StoredNote[]): Promise<void> {
    await this.ensureReady();
    await this.db!.execute('BEGIN TRANSACTION');
    try {
      for (const note of notes) {
        await this.db!.run(
          'INSERT INTO notes (uuid,title,content,updated_at,deleted_at,sync_status) VALUES (?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET title=excluded.title,content=excluded.content,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,sync_status=excluded.sync_status',
          [note.uuid, note.title, note.content, note.updatedAt, note.deletedAt, note.syncStatus]
        );
      }
      await this.db!.execute('COMMIT');
    } catch (error) {
      await this.db!.execute('ROLLBACK');
      throw error;
    }
  }

  async getCursor(): Promise<string | null> {
    await this.ensureReady();
    const result = await this.db!.query('SELECT value FROM sync_state WHERE key = ?', ['server_cursor']);
    return result.values?.[0]?.value ?? null;
  }

  async setCursor(cursor: string): Promise<void> {
    await this.ensureReady();
    await this.db!.run(
      'INSERT INTO sync_state (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      ['server_cursor', cursor]
    );
  }

  private async ensureReady(): Promise<void> {
    if (!this.db) await this.initialize();
  }
}
