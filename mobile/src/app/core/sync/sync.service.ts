import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Note } from '../models/note.model';
import { NoteDatabaseService } from '../database/note-database.service';

interface SyncResponse {
  accepted: string[];
  notes: Note[];
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly apiUrl = 'http://localhost:8000/api';
  private lastSync: string | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly database: NoteDatabaseService,
  ) {}

  async sync(): Promise<void> {
    const pending = await this.database.pending();

    if (pending.length) {
      const response = await firstValueFrom(
        this.http.post<SyncResponse>(`${this.apiUrl}/notes/sync`, { notes: pending }),
      );
      await this.database.markSynced(response.accepted);
    }

    const url = this.lastSync
      ? `${this.apiUrl}/notes?updated_since=${encodeURIComponent(this.lastSync)}`
      : `${this.apiUrl}/notes`;

    const response = await firstValueFrom(this.http.get<{ notes: Note[]; cursor: string }>(url));
    for (const note of response.notes) await this.database.save(note);
    this.lastSync = response.cursor;
  }
}
